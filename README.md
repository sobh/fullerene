<p align="center">
	<img src="images/logo.svg" alt="Fullerene" width="200">
</p>

# ⚛️ Fullerene

An English keyboard layout for split columnar keyboards, with an ANSI version
for laptops.

Fullerene is mainly inspired by
[Graphite](https://github.com/rdavison/graphite-layout) and
[Gallium](https://github.com/GalileoBlues/Gallium), and takes its name from
the first: graphite is carbon in flat sheets, and a
[fullerene](https://en.wikipedia.org/wiki/Fullerene) is a sheet of carbon
closed into a cage, like the
[C60 Buckyball](https://en.wikipedia.org/wiki/Buckminsterfullerene).

The layout closes in the same way: the most used keys sit together in the
middle, and only the rarest keys sit on the outer edge. C60 has 60 atoms, and
the layout was made for a 60-key split keyboard. Coincidence? Absolutely. But
every atom found a key. ⚛️😉

![Fullerene on a split keyboard](images/fullerene.svg)

```text
    v d l j   k f o u
q c s t n w   b h a e i '
z y g m r x   . p , / - ;
```

> [!TIP]
>
> See it on [Ergonomic Split Keyboards](KEYBOARDS.md) the ErgoDox EZ, Kinesis
> Advantage360, MoErgo Go60 and Cyboard Imprint.

## ✨ Design

- **Light pinkies:** no letter on the pinky top keys, and only the four
  rarest keys (`q z ' ;`) on the outer pinky column.
- **Balanced:** few redirects, lateral stretches and scissors, and plenty of
  rolls.
- **Helix and Vim friendly:** `b` sits left of `e` on the right home row, so
  the word motions back and to the end of a word keep their order; `w` is on
  the left hand.
- **Shortcuts:** `c`, `v` and `z` (copy, paste, undo) are on the left hand.

It was made in two stages with
[keyboard_layout_optimizer](https://github.com/dariogoetz/keyboard_layout_optimizer)
on English n-grams, with b and e pinned in place:

1. The 28 most used keys, with the outer pinky keys disabled and the rare keys
   left out.
2. The best placement of `q z ' ;` on the four outer pinky keys, out of all
   24.

## 📊 Stats

Community-style stats on the `oxey_english` corpus, in % (standard finger
model, pinky top key on the pinky):

| Layout        | SFB  | SFS   | LSB  | Scissors | Pinky     | Rolls | Redirects |
| ------------- | ---- | ----- | ---- | -------- | --------- | ----- | --------- |
| **Fullerene** | 1.23 | 7.04  | 1.37 | 0.95     | **13.08** | 45.14 | **2.07**  |
| Graphite      | 1.05 | 5.63  | 1.57 | 0.80     | 16.81     | 44.43 | 2.09      |
| Gallium       | 0.97 | 5.57  | 1.58 | 1.54     | 18.01     | 44.52 | 2.18      |
| Sturdy        | 0.95 | 5.73  | 2.48 | 1.02     | 16.15     | 48.02 | 3.04      |
| QWERTY        | 6.63 | 11.27 | 7.01 | 6.01     | 11.11     | 37.86 | 6.64      |

> [!NOTE]
>
> Same-finger skipgrams (SFS) are higher than in Graphite, Gallium and
> Sturdy: the left index finger covers `l j n w r x`. Moving any of them away
> raises the same-finger bigrams more than it saves.

## ⌨️ ANSI (laptop) version

A row-staggered keyboard has no outer pinky column, so the four rare keys move
to the pinky top keys and beside them:

![Fullerene on an ANSI keyboard](images/fullerene-ansi.svg)

```text
1 2 3 4 5 6 7 8 9 0 [ ]
 q v d l j k f o u ; z =
  c s t n w b h a e i '
   y g m r x . p , / -
```

`-` and `_` are in the letter grid, which frees the `-` and `=` keys for
the brackets: `[ {` on `-`, `] }` on `=`, and `= +` on `]`. Every other key
outside the letter grid is unchanged from US English.

`q` keeps its QWERTY key, so `z` (undo) is on the right hand here.

## 🎯 Try it

Practise Fullerene in the browser before installing anything, on your usual
keyboard. Download a layout file and import it as a custom layout:

| Trainer                         | Layout file                                                  |
| ------------------------------- | ------------------------------------------------------------ |
| [type-fu](https://type-fu.com/) | [`typing/fullerene.tfl`](typing/fullerene.tfl)               |
| [keybr](https://www.keybr.com/) | [`typing/fullerene.keybr.json`](typing/fullerene.keybr.json) |

Both follow the ANSI version above.

## 🐧 Linux install

[`linux/install.sh`](linux/install.sh) installs the XKB layout and registers it
in the layout lists, re-running itself with sudo:

```sh
./linux/install.sh      # install, or reinstall after an xkeyboard-config update
./linux/install.sh -u   # uninstall
```

Then select it:

```sh
setxkbmap fullerene            # X11
setxkbmap -layout us,fullerene # X11, next to US English
```

> [!TIP]
>
> Home row mods and other key remappers (kanata, keyd) work on key positions,
> so they keep working: a hold on the QWERTY `a` key still gives the same
> modifier, while a tap types `c`.

## 🖼️ Images

The layout images follow the viewer's light or dark theme, with colours from
[`images/palette.json`](images/palette.json). After changing the layout, update
`LAYOUT` and `ANSI` in [`images/generate.mjs`](images/generate.mjs) and
regenerate them:

```sh
node images/generate.mjs
```

The logo, a C60 fullerene, comes from [`images/logo.mjs`](images/logo.mjs):
`logo.svg` for the molecule alone, `logo-wordmark.svg` with the name.

```sh
node images/logo.mjs
```

## 📄 License

[MIT](LICENSE): free to use, change and share, with credit.
