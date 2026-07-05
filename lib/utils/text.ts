// Word-frequency filters, ported from instagram_analysis.py's STOPWORDS,
// EXTRA_FILLER, EMOJI_RE, system_msg_re, and STRUCTURAL_LABELS.

export const STOPWORDS = new Set(
  `
a an the this that these those is am are was were be been being
i me my mine we us our ours you your yours he him his she her hers it its
they them their theirs
to of in on at by for with from as into onto over under about
and or but if so because than then when while
do does did doing done
have has had having
will would shall should can could may might must
not no nor
there here
what which who whom whose
all any both each few more most other some such
just very
s t re ve ll d m
`
    .split(/\s+/)
    .filter(Boolean)
);

// Common interjections/slang that rank just below the top-50 "already shown"
// words but are still not meaningful content words, for the non-filler view.
export const EXTRA_FILLER = new Set(
  `
yes no yeah yea ya nah nope okay ok oh hey hi haha hahaha lmaoo lmaooo omg
wow bro dude guys fr ngl idk tbh im ur nw ig sm rn wyd wya
`
    .split(/\s+/)
    .filter(Boolean)
);

// Template labels from Instagram's own HTML that must never be mistaken for
// a real username when scanning likes/comments/notes/instants for "who you
// engage with" - see lib/parsers/activity.ts.
export const STRUCTURAL_LABELS = new Set([
  "Owner",
  "Author",
  "Hashtags",
  "Caption",
  "Media Owner",
  "URL",
  "Comment",
  "Time",
  "Name",
]);

export const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu;
export const WORD_RE = /[a-zA-Z']+/g;
export const URL_RE = /https?:\/\/\S+/g;

// Matches Python's system_msg_re (re.IGNORECASE) - deliberately no "g" flag
// since it's only ever used with .test(), which doesn't need one.
export const SYSTEM_MSG_RE =
  /sent an? (attachment|photo|video|voice message|link)|liked a message|unsent a message|reacted .* to (your|a) message|click for (audio|video|photo)|(started|ended|missed) (a |an )?(video|audio) (call|chat)|(video|audio) (call|chat) (ended|started)|duration: ?\d+ ?(second|minute)s?|missed (a |an )?(video|audio) (call|chat)|set the (nickname|theme|emoji|quick reaction)|changed the group photo|(left|joined) the group|added .* to the group|removed .* from the group|created the group|named the group|is now an admin|shared a story|^https?:\/\//i;
