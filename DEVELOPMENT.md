# 🧪 How Fullerene was made

Fullerene was not drawn by hand. It came out of
[neokey](https://github.com/sobh/neokey), a simulated annealing optimizer that
swaps keys and keeps the layouts that score better. The work was mostly in
deciding what "better" means: tuning the scoring until the layouts it favoured
were also good by the community's own measures, then testing the alternatives.

## 🎯 Goals

- **Light pinkies:** no letter on the pinky top keys, and as little as
  possible on the outer pinky column.
- **Well rounded:** no stat far off the best modern layouts, rather than one
  stat at its minimum.
- **Editor friendly:** `b` left of `e` on the right home row for the word
  motions of Vim and Helix, `w` on the left hand, and `c v z` (copy, paste,
  undo) on the left hand.

The targets below are community-style stats on the `oxey_english` corpus,
set close to Sturdy's numbers:

| Stat                              | Target | Fullerene |
| --------------------------------- | ------ | --------- |
| Same-finger bigrams (SFB)         | ≤ 1.0% | 1.23%     |
| Same-finger skipgrams (SFS)       | ≤ 6.5% | 7.04%     |
| Weak-finger (ring, pinky) doubles | ≤ 0.8% | 0.89%     |
| Pinky load                        | ≤ 15%  | 13.08%    |
| Redirects                         | ≤ 3%   | 2.07%     |
| Rolls (inward + outward)          | ≥ 44%  | 45.14%    |
| Scissors                          | ≤ 1%   | 0.95%     |
| Lateral stretches                 | ≤ 2.5% | 1.37%     |

A slightly higher SFB was accepted as long as SFS stayed low.

## ⚙️ The setup

- **Keyboard:** an ErgoDox with six columns per hand and three letter rows.
  The pinky top keys hold no letter, which leaves 32 keys for the 26 letters
  and `' , . / - ;`.
- **Key costs:** the ring and pinky keys cost more than the index and middle
  ones, and the outer pinky column the most.
- **Corpus:** English n-grams (`eng_shai`) for the optimizer. The stats above
  use a second corpus (`oxey_english`), so a layout can't simply overfit one.
- **Scoring:** a weighted sum of metrics: key costs, finger balance,
  same-finger repeats, movement patterns, rolls, lateral stretches and
  more. Lower is better.

### 🤙 Why the pinky top keys stay empty

The pinky top keys were left out of the keyboard before any optimizing, so
the optimizer never placed a letter there. It was a design choice, for three
reasons:

1. **The hardest pinky reach:** reaching up stretches the shortest, weakest
   finger forward, often with the whole hand. The key costs reflect it: the
   pinky top key costs five times its home key.

   | Pinky key    | Cost   |
   | ------------ | ------ |
   | Home         | **5**  |
   | Outer home   | 12     |
   | Bottom       | 16     |
   | Outer bottom | 18     |
   | **Top**      | **25** |
   | Outer top    | 35     |

2. **Pinky load:** the goal was a pinky load of 15% or less. Layouts that use
   the pinky top key for a letter (`b` in Graphite and Gallium, `v` in Sturdy)
   reach 16-18%; Fullerene has 13.08%.
3. **Pinky and ring together:** a pinky reaching up next to the ring finger
   makes scissors and costly moves. In the movement pattern metric, pinky to
   ring costs 4 and ring to pinky 6, against 0.1-0.9 for any move from the
   index.

The cost is on the index finger. With the pinky top keys out, the outer
pinky home and bottom keys take the four rarest keys (`q z ' ;`), and the
left index takes more letters (`l j n w r x`): the main reason Fullerene's
SFS (7.04%) is above Graphite's (5.63%). It trades a little more work for
the strongest finger for a lighter weakest one.

On a split keyboard, the pinky top keys are free for your keymap, such as
Tab or Esc. The ANSI version is the exception: a laptop has no outer pinky
column, so `q` and `;` move to the pinky top keys there.

## 📏 Evaluation metrics

Two sets of numbers judge a layout: the optimizer's score, which it minimizes,
and the community stats, which check the result against other layouts.

### Optimizer score

The score is the weighted sum of the metrics below, on the `eng_shai`
n-grams. Rolls have negative weights, so they lower it. **Stock** is the
weight the optimizer ships with (`default.yml`), **Fullerene** the one used
here, in bold where they differ. **Cost** is each metric's share of
Fullerene's 205.66:

| Metric                              | Measures                                                                                                      | Stock   | Fullerene | Cost   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------- | --------- | ------ |
| Key costs                           | The cost of each keystroke, from the keyboard's per-key costs                                                 | 20      | 20        | 111.43 |
| Finger repeats                      | Same-finger bigrams, dearer on weaker fingers and for stretches                                               | **780** | **2000**  | 52.06  |
| Secondary bigrams                   | The first and last key of each trigram, scored like a bigram: mostly same-finger skipgrams                    | **0.1** | **0.2**   | 40.44  |
| Movement pattern                    | Same-hand bigrams by finger pair, rows crossed and direction: pinky to ring costs more than index to anything | 100     | 100       | 21.32  |
| No handswitch in trigram            | Trigrams on one hand, dearer when they change direction                                                       | 400     | 400       | 15.19  |
| Lateral stretches                   | The index's inner column next to the middle finger, or the outer pinky column next to the ring finger         | **off** | **12**    | 12.20  |
| Finger balance                      | Distance from the intended load per finger (pinky 0.7, ring 1.4, middle and index 2.0)                        | 50      | 50        | 11.03  |
| Irregularity                        | Trigrams whose two halves are both awkward bigrams                                                            | 8.25    | 8.25      | 5.70   |
| No handswitch after unbalancing key | The same hand right after a key that pulls it off the home position                                           | 36      | 36        | 1.92   |
| Hand disbalance                     | Distance of each hand's load from 50%                                                                         | 40      | 40        | 0.51   |
| Manual bigram penalty               | The same key twice on a weak finger off the home row, like `ll` on the ring finger                            | **off** | **2100**  | 0.35   |
| Shortcut keys                       | `c` and `v` away from the left hand                                                                           | **off** | **5**     | 0.00   |
| Inward rolls                        | Two keys on one hand toward the index, then the other hand                                                    | **-2**  | **-3**    | -19.26 |
| Outward rolls                       | Two keys on one hand away from the index, then the other hand                                                 | **-1**  | **-3**    | -47.22 |

Weights don't compare across metrics, since each metric has its own scale.
The changes from the stock weights:

- **Same-finger bigrams** weigh 2000 instead of 780, and skipgrams (secondary
  bigrams) 0.2 instead of 0.1: the stock weights let SFB climb to about 2%.
- **Rolls** count the same in both directions (-3), where the stock weights
  favour inward rolls (-2) over outward ones (-1).
- **Lateral stretches** and the **manual bigram penalty** (weak-finger
  doubles) are on; they are off by default.
- **Shortcut keys** is on, to keep `c` and `v` on the left hand.

The next section covers how these weights were tuned.

### Community stats

The stats follow the definitions of the alt-layout community's analyzers,
on the `oxey_english` corpus, with the standard finger model: the pinky
covers its two columns and the pinky top key, and the index its two. Values
are percentages of all bigrams or trigrams that have every key on the
layout.

| Stat                | Counts                                                                              |
| ------------------- | ----------------------------------------------------------------------------------- |
| SFB                 | Bigrams typed by the same finger on two different keys                              |
| SFS                 | Skipgrams (the first and third key of a trigram) on the same finger, different keys |
| Weak-finger doubles | The same key twice on a ring or pinky finger                                        |
| LSB                 | Lateral stretches, as in the optimizer, at least two columns apart                  |
| Scissors            | Adjacent fingers of one hand, two rows apart                                        |
| Pinky               | Characters typed by a pinky                                                         |
| Rolls               | Trigrams with two keys on one hand, on different fingers, and one on the other      |
| Redirects           | One-hand trigrams on three fingers that change direction                            |

## 🔧 Tuning the scoring

The first runs gave low scores but poor layouts, so most of the work went
into the weights:

1. **Same-finger bigrams:** the first weights let SFB climb to about 2%,
   twice that of Graphite, Gallium and Sturdy. The SFB weight went up until
   optimized layouts landed near 1%.
2. **Rolls:** outward rolls first counted half as much as inward ones; they
   now count the same.
3. **Lateral stretches:** without a penalty, the optimizer put `r` on the
   index finger's inner column, with 2.58% lateral stretches. A penalty of
   12 (5 and 8 were also tried) gave the layouts closest to all targets.
4. **Finger balance:** a stronger balance term loaded the left ring and
   middle fingers more, but pushed SFB to 1.5-1.9%, so its weight stayed at
   50.
5. **Shortcuts:** a small cost nudges `c` and `v` to the left hand. Pinning
   all of `z x c v` in their QWERTY positions was stricter than needed, and
   cost about 12.6 points.
6. **Editor keys:** `b` and `e` were pinned on the right home row. With them
   there, the optimizer put `w` on the left hand on its own.

Every change was checked by optimizing again and comparing the results
against the targets, with several runs per setting, since each run ends in a
different layout.

## ⚛️ Core first

The best layouts so far still put a common key, `w`, on the outer pinky.
Pinning other keys there didn't help: every try scored worse or only moved
`w` down a row. So the layout was built in two stages instead:

1. **The 28 core keys:** with the outer pinky keys disabled and the four
   rarest keys (`q z ' ;`) left out of the n-grams. The best core came from
   an earlier run, without its outer pinky keys.
2. **The outer pinky:** every placement of `q z ' ;` on the four outer pinky
   keys, all 24 of them, scored on the full keyboard. The best put `q` and
   `z` on the left and `'` and `;` on the right.

This is the shape in the name: the most used keys packed in the middle, and
only the rarest on the edge.

## ✋ Hand swaps

Two swaps on the left index finger finished the layout. Both keep the
community stats as they were:

- `w` with `x`, to put `w` on the home row.
- `x` with `j`, to put `x` on the cheaper bottom key, with fewer scissors
  on real typing.

The SFS of 7.04% is the one target left open. The left index covers
`l j n w r x`, and no single swap brings SFS under 6.5% without raising SFB
to 1.5% or more.

## 🔬 Alternatives tested

With Fullerene chosen, its right hand (close to Graphite's) was pinned, all
but `k`, and
the left hand optimized again with other home rows, to see what it would
cost to follow Graphite more closely. Each home row was optimized twice:
with the usual key costs, and with ring and pinky keys about 50% dearer.

| Left home row (pinky to index) | Score  | SFB  | SFS  | Pinky | Weak doubles |
| ------------------------------ | ------ | ---- | ---- | ----- | ------------ |
| **Fullerene** (`c s t n`)      | 205.66 | 1.23 | 7.04 | 13.08 | 0.89         |
| `n r t s` (Graphite's)         | 210.80 | 1.34 | 6.03 | 16.79 | 1.34         |
| `n r t s`, lowest SFS          | 211.40 | 1.26 | 5.57 | 15.08 | 1.34         |
| `n l t s`                      | 214.06 | 1.26 | 5.57 | 15.08 | 1.34         |
| `n s t r`                      | 215.88 | 1.54 | 6.86 | 16.79 | 0.94         |
| `n s t l`                      | 220.13 | 1.42 | 6.26 | 16.79 | 0.94         |

Stats in %, lowest-scoring layout of each home row. Scores are the optimizer's
(lower is better) and only compare layouts within this setup.

`n` on the pinky brings SFS under the target, but costs 2-4% more pinky load
and, for `n r t s` and `n l t s`, more ring and pinky doubles (`ll`). The
optimizer resists it mostly because of movement: a bigram from the pinky to
the ring or middle finger, like `nd` or `nt`, costs far more than one from
the index, where Fullerene keeps `n`.

Fullerene stayed the best overall. The light right index (12.1% of
keystrokes) wasn't treated as a flaw: Vim, Helix and window manager
shortcuts already keep that finger busy.

## 📊 Compared with well-known layouts

Community-style stats on the `oxey_english` corpus, in % (standard finger
model, pinky top key on the pinky), with the optimizer's score from the same
setup as above:

| Layout                                                  | Score  | SFB  | SFS   | Weak doubles | LSB  | Scissors | Pinky     | Rolls (in / out)    | Redirects |
| ------------------------------------------------------- | ------ | ---- | ----- | ------------ | ---- | -------- | --------- | ------------------- | --------- |
| **Fullerene**                                           | 205.66 | 1.23 | 7.04  | 0.89         | 1.37 | 0.95     | **13.08** | 45.14 (13.0 / 32.1) | **2.07**  |
| [Sturdy](https://oxey.dev/layouts/sturdy/)              | 223.46 | 0.95 | 5.73  | 1.06         | 2.48 | 1.02     | 16.15     | 48.02 (22.9 / 25.1) | 3.04      |
| [Graphite](https://github.com/rdavison/graphite-layout) | 243.46 | 1.05 | 5.63  | 1.35         | 1.57 | 0.80     | 16.81     | 44.43 (21.6 / 22.9) | 2.09      |
| [Gallium](https://github.com/GalileoBlues/Gallium)      | 251.92 | 0.97 | 5.57  | 1.36         | 1.58 | 1.54     | 18.01     | 44.52 (21.1 / 23.4) | 2.18      |
| [Engrammer](https://github.com/sunaku/engrammer)        | 268.83 | 1.52 | 7.15  | 0.87         | 0.68 | 0.60     | 16.68     | 42.31 (28.2 / 14.1) | 2.99      |
| QWERTY                                                  | 702.17 | 6.63 | 11.27 | 1.54         | 7.01 | 6.01     | 11.11     | 37.86 (20.3 / 17.5) | 6.64      |

Gallium is its column-staggered version. For the score, Sturdy, Graphite,
Gallium and Engrammer were placed on the same ErgoDox.

- **Fullerene leads on** pinky load (13.08%, the lowest after QWERTY) and
  redirects (2.07%), with fewer lateral stretches than Sturdy, Graphite and
  Gallium.
- **It trails on** same-finger bigrams and skipgrams. Sturdy, Graphite and
  Gallium keep SFB under 1.1% and SFS under 5.8%, at the price of 16-18%
  pinky load.
- **Its rolls lean outward** (32.1% out, 13.0% in), the reverse of the
  others. The scoring counts both directions the same.
- **Engrammer** has the fewest lateral stretches and scissors, but more SFB
  and SFS than Fullerene, Sturdy, Graphite and Gallium.

> [!NOTE]
> The score favours Fullerene: it was optimized for this exact setup, and the
> keyboard files give the pinky top key, which the other layouts use, to the
> ring finger. Use the score to rank layouts within one setup, and the stats
> to compare them.
