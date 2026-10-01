---
name: portal-card-order
description: Reorder the Knowledge Surrounding AI portal cards and synchronize card numbers and guide pagination without touching unrelated page content.
---

# Portal Card Order

Use this skill when the order of guide cards in this workspace's root `index.html` must change.

## Source of truth

The order of `<nav class="menu">` cards in the root `index.html` is the only source of truth. Keep each card's destination, illustration, title, and description together while moving it.

## Card illustration baseline

The five established portal illustrations are all 1536×1024, an average **3:2 (1.5)** aspect ratio. New portal-card illustrations should use this landscape ratio, preferably with a transparent background and a vertically compact subject. This lets the illustration overlap the title area without reaching the description.

Use `.card-illustration img` with `object-position:center top`; do not compensate for an unsuitable square image by pushing it down into the copy.

## Required synchronization

After reordering, update all of the following in the same change:

1. The visible `NN / ...` number on every portal card.
2. A guide hero's portal-order label when it has one.
3. Footer pagination across every guide. The first item has only a next link; the last has only a previous link; do not make the sequence circular.
4. Any newly adjacent pages whose `prev` / `next` text or `rel` attributes would otherwise be stale.

## Boundaries

- Do not change the order of sections inside an individual guide; their local section numbers are not portal card numbers.
- Preserve each guide's visual theme, sticky launcher, PWA configuration, copyright, and portal-return buttons.
- Do not stage unrelated untracked files. Inspect the staged diff and verify each destination URL before committing.
