"""Isolate alpha-connected silhouettes, then pad and validate each sprite.

The nominal 5x3 arrangement identifies intended subjects only. Actual extraction
uses connected alpha pixels and their complete bounds, never uniform cell crops.
Requires Pillow and NumPy. Run from any directory; outputs stay in fortune-mock.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SIZE, PAD = 512, 64


def components(alpha):
    """Run-length connected component labeling with 8-pixel connectivity."""
    parents, runs, previous = [], [], []
    def find(i):
        while parents[i] != i:
            parents[i] = parents[parents[i]]
            i = parents[i]
        return i
    for y, row in enumerate(alpha > 0):
        padded = np.pad(row.astype(np.int8), (1, 1))
        edges = np.flatnonzero(np.diff(padded))
        current = []
        scan = 0
        for start, stop in zip(edges[::2], edges[1::2]):
            start, stop = int(start), int(stop)
            label = len(parents)
            parents.append(label)
            while scan < len(previous) and previous[scan][1] < start:
                scan += 1
            cursor = scan
            while cursor < len(previous) and previous[cursor][0] <= stop:
                parents[find(label)] = find(previous[cursor][2])
                cursor += 1
            current.append((start, stop, label))
            runs.append((y, start, stop, label))
        previous = current
    groups = {}
    for y, start, stop, label in runs:
        groups.setdefault(find(label), []).append((y, start, stop))
    result = []
    for spans in groups.values():
        area = sum(stop-start for y, start, stop in spans)
        bounds = (min(s[1] for s in spans), min(s[0] for s in spans), max(s[2] for s in spans), max(s[0] for s in spans)+1)
        result.append({'area':area,'bounds':bounds,'runs':spans})
    return sorted(result, key=lambda c:c['area'], reverse=True)


def extract():
    (ROOT/'images').mkdir(exist_ok=True)
    report = []
    for batch in range(1,5):
        source = ROOT/'sprites'/f'sheet-{batch:02}.png'
        rgba = np.asarray(Image.open(source).convert('RGBA')).copy()
        height, width = rgba.shape[:2]
        # Generated sheets can contain almost-invisible alpha dust bridging
        # otherwise separate sprites. Detect cores above 8/255 alpha, then
        # restore the original anti-aliased boundary around each core.
        parts = components(np.where(rgba[:,:,3]>8,rgba[:,:,3],0))
        slots = {}
        for part in parts:
            if part['area'] < 8000:
                continue
            x0,y0,x1,y1 = part['bounds']
            col = min(4,int(((x0+x1)/2)/width*5))
            row = min(2,int(((y0+y1)/2)/height*3))
            slot = row*5+col
            if slot in slots:
                raise ValueError(f'{source.name} slot {slot}: multiple substantial silhouettes; inspect manually')
            slots[slot] = part
        if len(slots) != 15:
            raise ValueError(f'{source.name}: found {len(slots)} intended sprites, expected 15')
        for slot in range(15):
            part = slots[slot]
            x0,y0,x1,y1 = part['bounds']
            if x0 == 0 or y0 == 0 or x1 == width or y1 == height:
                raise ValueError(f'{source.name} slot {slot}: source silhouette touches image edge')
            mask = np.zeros((height,width),dtype=bool)
            for y,start,stop in part['runs']:
                mask[y,start:stop] = True
            # Restore a 2px anti-alias fringe without picking up neighbors or
            # the low-alpha shadow/dust that connected them in the original.
            for _ in range(2):
                expanded = mask.copy()
                for dy in (-1,0,1):
                    for dx in (-1,0,1):
                        expanded |= np.roll(np.roll(mask,dy,axis=0),dx,axis=1)
                mask = expanded
            mask &= rgba[:,:,3]>0
            visible_source = np.argwhere(mask)
            y0,x0 = map(int,visible_source.min(axis=0))
            y1,x1 = map(lambda v:int(v)+1,visible_source.max(axis=0))
            isolated = rgba[y0:y1,x0:x1].copy()
            isolated[~mask[y0:y1,x0:x1]] = 0
            subject = Image.fromarray(isolated)
            factor = (SIZE-2*PAD)/max(subject.size)
            target = tuple(max(1,round(value*factor)) for value in subject.size)
            subject = subject.resize(target,Image.Resampling.LANCZOS)
            # Resampling may introduce one-pixel specks: preserve the complete
            # largest connected subject and remove any disconnected artifacts.
            resized = np.asarray(subject).copy()
            resized_parts = components(resized[:,:,3])
            keep = np.zeros(resized.shape[:2],dtype=bool)
            for y,start,stop in resized_parts[0]['runs']:
                keep[y,start:stop] = True
            resized[~keep] = 0
            subject = Image.fromarray(resized)
            canvas = Image.new('RGBA',(SIZE,SIZE),(0,0,0,0))
            canvas.alpha_composite(subject,((SIZE-subject.width)//2,(SIZE-subject.height)//2))
            number = (batch-1)*15+slot
            month, choice = number//5+1, number%5+1
            name = f'fortune-{month:02}-{choice:02}.png'
            dest = ROOT/'images'/name
            canvas.save(dest,optimize=True)
            check = np.asarray(Image.open(dest))[:,:,3]
            visible = np.argwhere(check>0)
            top,left = visible.min(axis=0)
            bottom,right = visible.max(axis=0)+1
            margins = [int(left),int(top),SIZE-int(right),SIZE-int(bottom)]
            assert min(margins)>=SIZE*.1,(name,margins)
            assert len(components(check))==1,f'{name}: disconnected fragments remain'
            assert np.all(check[:PAD]==0) and np.all(check[-PAD:]==0)
            assert np.all(check[:,:PAD]==0) and np.all(check[:,-PAD:]==0)
            report.append({'image':name,'source':source.name,'sourceBounds':[x0,y0,x1,y1],'margins':margins,'components':1,'transparentBackground':True,'sourceEdgeContact':False,'sourceOpaquePixelsRetained':part['area'],'isolatedSmallComponentsDiscarded':len(parts)-15,'resizeFragmentsDiscarded':len(resized_parts)-1})
        print(f'{source.name}: 15 isolated sprites, complete source bounds and 10% margins verified')
    (ROOT/'sprites'/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    contact_sheets(report)


def contact_sheets(report):
    for batch in range(4):
        sheet = Image.new('RGB',(1400,960),'#f6f2fc')
        draw = ImageDraw.Draw(sheet)
        for slot in range(15):
            entry = report[batch*15+slot]
            img = Image.open(ROOT/'images'/entry['image']).resize((270,270),Image.Resampling.LANCZOS)
            x,y = slot%5*280, slot//5*320
            # Checkerboard makes alpha and leftover fragments easy to inspect.
            for cy in range(y+20,y+290,18):
                for cx in range(x+5,x+275,18):
                    color = '#e7e0ee' if ((cx-(x+5))//18+(cy-(y+20))//18)%2 else '#fff'
                    draw.rectangle((cx,cy,min(cx+17,x+274),min(cy+17,y+289)),fill=color)
            sheet.paste(img,(x+5,y+20),img)
            draw.text((x+12,y+295),entry['image'],fill='#55456c')
        sheet.save(ROOT/'sprites'/f'inspection-{batch+1:02}.png')


if __name__ == '__main__':
    extract()
