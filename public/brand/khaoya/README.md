# Khaoya brand folder

Open `index.html` in a browser to see every logo. Usage rules per placement come later; this file holds the folder map, the colour rule and the fonts.

## The colour rule (always the same)

| Part | Colour |
|---|---|
| The plate (the round icon) | **Marigold** `#F4B91A` |
| The smile inside the plate | **Green** `#0C5A3E` |
| The name (khaoya, খাওয়া, mama, মামা, Business, Menu, Deals) | **Green** `#0C5A3E` |
| The smile under the name | **Marigold** `#F4B91A` |
| Mama's AI sparkle and the "by Khaoya" line | **Green** `#0C5A3E` |
| Background behind the logo | **Cream** `#F7F1DE` or white |

On dark backgrounds (green `#0C5A3E`, deep green `#0B3B29`, black) use the `-reverse` files: the name turns **cream** `#F7F1DE`, marigold stays marigold.
On the website: light mode always shows the green name, dark mode always shows the cream name. The only light-mode exception is the dark green footer and the owner panel's green side bar, where the name is cream.
On a marigold button, Mama's plate turns green and her smile marigold, so she never disappears into the button.
The two main colours of the brand are **green** and **cream**, with **marigold** as the accent. No other colours in any logo.

## Fonts

| Use | Font | Weight in the logo | Get it |
|---|---|---|---|
| English | **Figtree** | ExtraBold 800 (Business, Menu, Deals: Bold 700; "by Khaoya": Bold 700) | https://fonts.google.com/specimen/Figtree |
| Bangla | **Noto Sans Bengali** | ExtraBold 800 (small lines: Bold 700) | https://fonts.google.com/noto/specimen/Noto+Sans+Bengali |

Both are free (Open Font License). For normal text on the website and in print use the same two fonts at 400 to 700.
The logo files do not need the fonts: the letters are already turned into shapes.

## Folders

```
khaoya/
  index.html            preview of everything
  colors/               colors.css (for the website), palette.json, palette.svg, palette.png
  logo/
    common/             the files used every day, as SVG and transparent PNG (drag and drop)
    khaoya/             main logos (plate + name: en, bn, both), wordmarks (en, bn), one-line, icon
    mama/               Mama AI by Khaoya: main (talking plate + mama), wordmarks (en, bn), icon
    business/           Khaoya Business, Menu and Deals (en and bn)
    app-icon/           app icons (svg, png sizes) and favicons (.ico)
```

Inside each logo family:

- `svg/` sharp at any size, no background
- `png/` transparent PNG (no background), 2000 px wide (icons 1024 px): drag and drop into Canva, Word, slides
- `png-background/` the same PNG on its background colour, ready to post

Every logo comes in four colours: `-color` (light backgrounds, the main one), `-reverse` (dark backgrounds), `-black` and `-white` (one colour printing).

## Making changes

The logos are made by `scripts/brand/logo.py` (shapes and SVGs), `scripts/brand/png.mjs` (PNGs) and `scripts/brand/index.mjs` (this preview). The same script writes `components/ui/brand-art.ts`, which the website uses for its logo, so the site and this folder always match.
