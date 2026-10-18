# Speculative fiction discovery

## Problem

Finding the next science fiction or fantasy book to buy is slow and noisy. The
Kindle store search is full of Kindle Unlimited filler and keyword-stuffed
titles. It also shows books I already bought, and I cannot filter them out. It
also does not know where I am in a series.

## Who it is for

Me and my daughter. We both read speculative fiction and buy it on Kindle UK
(`amazon.co.uk`). No third user will use or install this tool.

## The smallest thing that proves it

One list built from Hugo, Nebula, Clarke and BSFA novels, winners and
shortlists, with clean titles.

- It hides every book I own on Kindle. The filter is "owned on Kindle", not
  "read". Books I read elsewhere I skip by eye.
- A series takes one entry. The entry is the book after the last one I own,
  whichever book the award named. If I own none, it shows book 1. If I own all,
  the series is not on the list.
- It goes back year by year, newest first, until it holds ten entries.
- Each entry links to a Kindle UK search for that book.

In one sitting I find at least three books I want and did not know about.

I refresh the owned list by hand when I look for a book. If the Kindle export
is hard to get or to match, each entry gets an "I own this" checkbox. A ticked
book stays hidden.

Triage keys, a reading queue, and a Goodreads import wait until this works.

I stop if either of these is true:

- I cannot get my Kindle purchase history in a form I can match against the
  list, and the checkbox fallback is too much work.
- After removing what I own, too few award novels remain to be worth browsing.

## Out of scope

- Personal recommendations or "similar to" suggestions. The award lists are the
  curation.
- Buying, prices, or deal alerts. The tool hands off to Amazon and stops.
- Genres outside speculative fiction.
- Users beyond the two of us, cross-user sharing, or ratings.
- A clean Amazon page. The buy link lands on Amazon search results, so some ads
  and Kindle Unlimited noise remain on that last step.
- Books read on paper or elsewhere.
- Updates on every purchase.

## Open questions

- How do I export my Kindle purchase history: the Amazon personal data request,
  or the Manage Your Content and Devices page? Which one gives title and author?
  Request it before stage 3.
- How long does the list take to build by hand for the last five Clarke
  shortlists, with the series rule? Time it once.
- Stage 3: a web server on OrbStack with a login. Still open: where the data
  lives, and the source of award data and series order. The root `concept.md`
  holds an early sketch.

## Decisions made while we explored

- Filter on owned, not read: the Kindle export is the only history I have.
- Series rule: a shortlisted book 4 is a reason to start a series, not a place
  to start.
- Batch refresh: a live tool costs much more, and I look a few times a year.
- Checkbox fallback: it covers a failed export and missed title matches.
- Build, not Worlds Without End: WWEnd has no import and no "owned" status
  (Read, Reading, Not Read only). It has no series rule and no Kindle UK link.

## Risks

- **The Kindle export is unknown.** This is stop condition 1.
- **My own titles are dirty.** The award lists are clean, but my purchases carry
  store titles with keyword stuffing. Some owned books will slip through the
  match. The checkbox limits the damage.
- **Older books are missing from Kindle UK.** Some links fail. I accept this.
- **The cost does not match the use.** Ten titles by hand take about twenty
  minutes, a few times a year. The series rule is the slow part by hand, and
  the main reason to build.
- **Nothing brings me back.** New award lists come out about once a year.

## Feasibility flags

- **Series order needs a second source.** Award lists name only the nominated
  book. The series rule needs the full reading order of every series. Medium.
- **Title matching.** Matching store titles to clean titles is fuzzy work. Small
  to medium, with the checkbox as a backstop.
- **A login for one user.** It pays off only if I use the tool away from my
  Mac. Small to medium.
- **The Amazon data request.** Free. Time to arrive is unknown.
