---
name: simulation-launcher
description: Add a reusable sticky simulation launcher dock to an educational web page when the page needs an interactive practice entry point.
---

# Simulation Launcher

Use this skill when adding a practice-simulator launcher to a knowledge or tutorial page in this workspace. It covers the launcher dock only; build the simulator modal and its exercises only when the user asks for them.

## Launcher rules

- Place the dock after the page footer and before `</body>` so it stays separate from page navigation and content.
- Use `position: sticky`, `bottom: 0`, `z-index: 850`, a minimum height of `5em`, and centered content. Give the page its own class prefix to avoid conflicts with launchers on other pages.
- Match the page's color system, typography, and border treatment. Include a short primary action label and, where useful, a compact secondary description.
- If a simulator has not been built yet, show that state clearly and disable the button. Do not create a nonfunctional active launcher.
- Add a mobile breakpoint that shortens the dock and can hide secondary button text while retaining an accessible label.

## When a simulator is added later

Keep the simulator local to the page: use a dialog with an explicit close control, keyboard Escape handling, and no real account, file-system, or network side effects unless the user specifically requests them. Verify the launcher and dialog work at both desktop and mobile widths.
