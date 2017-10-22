---
bee_id: Benetta
tags:
---

I use [natural](https://github.com/NaturalNode/natural) to tokenize the input, then match nouns against a dump of [Geonames](http://geonames.org) (right now using only German place names).

![Anatomy of Pauliner](/images/pauliner.jpg =300x*)

Lots of things to do, in no particular order:

- spellcheck and suggestions (“You entered *Belrin*. Showing matches for *Berlin*.”)
- confidence rating for matches
- more sophisticated NLP (“One hour south of Göttingen on the autobahn toward Kassel” is not a match for either “Göttingen” or “Kassel” but for some place one hour drive south of Göttingen in the direction of Kassel
- crowdsourcing the accuracy of matches
- capability to add different gazetteers such as GNIS, ODI, Pleiades and others (this would require writing interfaces between gazetteer data formats and the data format that Pauliner understands so that the gazetteers may be easily updated)