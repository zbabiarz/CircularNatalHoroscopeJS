import React, { useState } from 'react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const SAMPLE_REPORT = `===WOUND_NAME===
The Unheard Voice

===TAGLINE===
The wound began where you were supposed to feel safest — and your voice learned it was not.

===OVERVIEW_INTRO===
Somewhere early, inside the house that was supposed to be your first safe place, something happened to your voice. Not a single dramatic moment, necessarily. More like a slow calibration. You learned that speaking fully, being heard completely, or expressing the messy, honest, complicated version of what you actually thought was not always met with safety. So you adjusted. You softened your edges, over-explained, went quiet, or became so sharp that nobody could ever silence you again. This is the Chiron wound at the intersection of language, belonging, and the earliest rooms you ever lived in.

===OVERVIEW_GRID===
THE WOUND|||Being heard, believed, and understood got tangled up with feeling safe at home. Your voice carries a hesitation that was built before you were old enough to name it.
THE PROTECTION|||Read the room. Soften it. Explain more. Make it funny. Go quiet. Keep everyone comfortable. These are the strategies the shadow built to keep your voice from landing in a dangerous place.
LOVE|||You want to be deeply known, but one misunderstanding can still feel like emotional exile. Intimacy requires the kind of verbal honesty your wound trained you to avoid.
MONEY|||Asking, pricing, negotiating, or naming your value can wake up the part that still expects pushback. The voice that hesitates at home often hesitates at the register.
CAREER|||You may know exactly what needs to be said and still wait one beat too long to say it. Your career wound is not a lack of talent; it is a delay between knowing and speaking.
THE GOLD|||Your voice can become the thing people trust, remember, promote, quote, follow, and pay for. The wound that silenced you is sitting on a gift that has already been sharpened by pain.

===OVERVIEW_BULLETS===
the childhood wound and the exact protection it built to keep you safe
your recurring triggers and the specific moments that hit harder than they should
how this wound fingerprints your relationships, money, career, body, and visibility
the power hiding inside the pattern and the gold it has already been building
integration tools, journal prompts, and a Chiron cheat sheet for the people you love

===OVERVIEW_CLOSING===
The thing that once made you afraid to use your voice may become the very thing people pay to hear.

===SECTION_1_DIVIDER_DESCRIPTION===
The story started early. Let's go back to the rooms, rules, and family dynamics that first taught your voice what was safe — and what wasn't.

===SECTION_1A_TITLE===
THE CHILDHOOD WOUND

===SECTION_1A_SUBTITLE===
When the house taught your voice its rules

===SECTION_1A_SUBHEADER===
CHIRON IN GEMINI · 4TH HOUSE

===SECTION_1A_BODY===
Chiron in Gemini in the 4th house means the wound lives where language meets belonging. The 4th house is the foundation: family, home, the emotional baseline you carry into every room for the rest of your life. Gemini rules communication, thought, the way ideas move between people. Put those together and you get a wound that says: the way I think, speak, or express myself was not fully safe inside my own home.

This does not necessarily mean the household was overtly abusive. Sometimes the wound is quieter than that. Maybe there was a parent whose moods were unpredictable, and you learned to read the room before opening your mouth. Maybe there was a sibling who got more airtime, and your voice got folded into the background. Maybe the family valued a certain kind of communication — logic over emotion, politeness over honesty, silence over conflict — and you learned to translate yourself into a version that fit.

The result is a voice that second-guesses itself. Not because it has nothing to say, but because it learned early that saying the wrong thing in the wrong tone at the wrong time could cost something. Safety. Connection. Peace. Love.

===SECTION_1A_CALLOUT_TITLE===
THE CORE OF THE WOUND

===SECTION_1A_CALLOUT_BODY===
Your voice may have learned that being fully expressed — honest, unedited, emotionally real — was dangerous inside the one place where it should have been safest. That early calibration still runs beneath every conversation, negotiation, and intimate exchange you have today.

===SECTION_1A_BODY2===
This wound does not announce itself. It hides inside a perfectly reasonable adult who has learned how to communicate well, listen carefully, and choose words wisely. The skill is real. The wound is underneath it. The question this placement asks you to sit with is: are you choosing your words, or is the wound still choosing them for you?

===SECTION_1B_TITLE===
THE PROTECTION

===SECTION_1B_SUBTITLE===
What your voice learned to do to keep you safe

===SECTION_1B_SUBHEADER===
THE SHADOW'S VERY IMPORTANT JOB

===SECTION_1B_BODY===
A wound this old does not walk into adulthood unprotected. It builds armor. Strategies. A whole operating system designed to make sure the original pain never happens again. The problem is, the strategies that protected you at seven are now running your relationships, your career, and your capacity for intimacy at thirty-seven. They are not bad strategies. They were brilliant when you built them. But they have overstayed their usefulness, and now they are costing you the very things they were designed to protect.

===SECTION_1B_GRID===
READ THE ROOM|||You scan faces, tone, and energy before deciding how much of the truth feels safe to say. This kept you safe once. Now it keeps you performing instead of connecting.
OVER-EXPLAIN|||You add context, nuance, evidence, and one last clarification — because being misunderstood feels bigger than a simple disagreement. It feels like disappearing.
MAKE IT FUNNY|||Humor becomes a pressure valve. You can say the vulnerable thing as long as everybody is laughing while you do it. The truth comes out, but never naked.
GO QUIET|||Sometimes the safest way to protect the voice is not to use it at all. Withdrawal is not passivity. It is a calculated retreat to avoid a battlefield that used to be the dinner table.
BECOME THE TRANSLATOR|||You get so good at understanding everyone else that nobody notices how much work it takes to make yourself understood. The wound hides behind empathy.
BECOME IMPOSSIBLE TO IGNORE|||Some people swing the other way entirely and build a voice so strong, so sharp, so loud that nobody ever gets to silence them again. Volume becomes armor.

===SECTION_1B_CALLOUT_TITLE===
WHY IT KEEPS SHOWING UP

===SECTION_1B_CALLOUT_BODY===
The shadow is not trying to sabotage your life. It is trying to protect a very old version of you from a very old kind of pain. Every time you read a room before speaking, over-explain something that should have been simple, or go quiet when you had something important to say — that is the wound doing its job. The first step is not to fight the pattern. The first step is to see it and say thank you.

===SECTION_1B_BODY2===
That is why you can know, intellectually, that you are allowed to speak up, ask for what you want, name your price, or say the uncomfortable thing — and still hesitate. The wound is not operating at the level of logic. It is operating at the level of survival. And survival always wins until the nervous system learns something new.

===SECTION_1C_TITLE===
RECURRING TRIGGERS

===SECTION_1C_SUBTITLE===
The moments that hit harder than they look

===SECTION_1C_SUBHEADER===
THE LIVE WIRES

===SECTION_1C_BODY===
Triggers are useful because they are immediate, involuntary, and specific. They show you exactly where the wound still has charge. When something triggers you, it is not because you are overreacting. It is because the present moment just brushed against an old wound that never fully closed. These are the moments that consistently activate this Chiron placement.

===SECTION_1C_GRID===
BEING INTERRUPTED|||It can land as more than bad manners. For this placement, interruption can feel like confirmation: what I have to say does not matter enough to finish.
BEING MISUNDERSTOOD|||Especially after you tried hard to explain yourself clearly. The wound hears emotional distance where there may only be a difference of perspective.
WORDS PUT IN YOUR MOUTH|||Few things light this placement up faster than somebody confidently telling you what you meant. The wound hears: your voice is not even yours.
BEING DISMISSED|||A tiny eye roll, a subject change, a quick "you're overthinking it" — each one can open a file that is approximately forty-seven years thick.
FAMILY DYNAMICS|||Nothing transports you back to an earlier version of yourself quite like the people who knew that version first. Holiday dinners are a masterclass in trigger management.
BEING PUBLICLY QUESTIONED|||The voice may freeze, overperform, or come out swinging when credibility feels like it is on the line. The audience does not matter. The wound does.

===SECTION_1C_CALLOUT_TITLE===
TRIGGERS ARE PORTALS

===SECTION_1C_CALLOUT_BODY===
The present moment is the doorway into the original wound. Every time something triggers this Chiron placement, it is also an invitation to respond differently than you did at seven or seventeen. Not perfectly. Just differently. That is where integration lives.

===SECTION_1C_BODY2===
Notice what happens in the first five seconds after you are triggered. That is the shadow's script running. The goal is not to stop the reaction. The goal is to notice it, name it, and give yourself one extra breath before you choose your next move.

===SECTION_2_DIVIDER_LABEL===
THE FINGERPRINTS

===SECTION_2_DIVIDER_DESCRIPTION===
This wound does not stay neatly in childhood. It follows the voice into love, the body, money, work, visibility, friendship, and every room where being known matters.

===SECTION_2A_TITLE===
LOVE + INTIMACY

===SECTION_2A_SUBTITLE===
Where the voice meets vulnerability

===SECTION_2A_SUBHEADER===
RELATIONSHIPS AS A MIRROR

===SECTION_2A_BODY===
Intimacy requires exactly what this wound makes hardest: being heard without editing. In love, Chiron in Gemini in the 4th house shows up as a deep longing to be truly known — paired with a well-trained instinct to soften, filter, or translate what you actually feel into something safer to say.

You may attract partners who are not great listeners. Or partners who are wonderful listeners but whom you still cannot bring yourself to be fully honest with. The pattern is not always about the other person. Sometimes it is about the voice that was trained to protect itself long before this relationship existed.

The most common love pattern with this placement is the slow accumulation of unspoken things. Not lies. Not even secrets. Just the daily micro-edits — the thing you almost said at dinner, the feeling you translated into a joke, the need you reframed as a suggestion so it would not sound too demanding. Over time, those edits create distance. And the distance feels like proof: see, they do not really know me.

===SECTION_2A_CALLOUT_TITLE===
THE INTIMACY EDGE

===SECTION_2A_CALLOUT_BODY===
The fastest way to deepen a relationship with this placement is to say the thing you are currently editing. Not the explosive version. Not the rehearsed version. The real one. One honest sentence will do more than a year of careful translations.

===SECTION_2A_BODY2===
When this wound begins to heal in love, it does not look like dramatic confrontation. It looks like one person saying something small and true in a moment where they used to go quiet. That is the voice reclaiming itself. That is Chiron turning.

===SECTION_2B_TITLE===
FRIENDSHIP + COMMUNITY

===SECTION_2B_SUBTITLE===
Where belonging meets the voice

===SECTION_2B_SUBHEADER===
THE SOCIAL WOUND

===SECTION_2B_BODY===
In friendships, this placement often creates the person everyone comes to with their problems — and who rarely brings their own. You become the translator, the mediator, the one who always knows the right thing to say. People trust your voice when it is in service of them. The wound shows up when it is time to use that voice for yourself.

You may notice a pattern of friendships where you feel slightly unseen. Not disliked. Not excluded. Just not fully landed. The group knows a version of you — the articulate one, the funny one, the wise one — but there is a quieter version underneath that does not get much airtime.

===SECTION_2B_CALLOUT_TITLE===
THE FRIENDSHIP PATTERN

===SECTION_2B_CALLOUT_BODY===
You give voice to everyone else's experience so fluently that nobody thinks to ask about yours. The wound hides behind helpfulness. Start by sharing something you did not plan to say.

===SECTION_2B_BODY2===
Community heals this wound when you stop performing belonging and start practicing it. That means showing up imperfectly. Saying the half-formed thing. Letting people meet the version of you that has not been edited for their comfort.

===SECTION_2C_TITLE===
BODY + WELL-BEING

===SECTION_2C_SUBTITLE===
Where the unspoken lives physically

===SECTION_2C_SUBHEADER===
THE BODY KEEPS THE SCORE

===SECTION_2C_BODY===
Chiron in Gemini often shows up in the body through the throat, jaw, shoulders, and hands. The places where communication lives physically. You might carry tension in your jaw from years of clenching around words you did not say. Shoulder tightness from carrying conversations that should have been shared. Throat issues that flare up when the voice is being suppressed.

The 4th house adds a layer: the body responds to emotional safety cues from the environment. When the room does not feel safe — even if the threat is only emotional — the body tightens. Breath shortens. The diaphragm contracts. Speech gets faster or disappears entirely. This is not anxiety in the clinical sense. This is a body that learned to protect the voice by pulling it inward.

===SECTION_2C_CALLOUT_TITLE===
THE BODY SIGNAL

===SECTION_2C_CALLOUT_BODY===
Pay attention to what your throat, jaw, and shoulders do in conversations where the stakes feel high. The body will show you the wound before the mind admits it is there.

===SECTION_2C_BODY2===
Healing this wound in the body looks like learning to exhale before you speak. Releasing the jaw. Dropping the shoulders. Letting the voice come from the belly instead of the throat. Somatic practices, breathwork, and singing are unexpectedly powerful for this placement.

===SECTION_2D_TITLE===
MONEY + SELF-WORTH

===SECTION_2D_SUBTITLE===
Where the voice meets value

===SECTION_2D_SUBHEADER===
THE PRICING WOUND

===SECTION_2D_BODY===
Money and voice are more connected than most people realize. Asking for a raise, naming your price, negotiating a contract — every one of these requires the same skill that the wound disrupted: the ability to say what you mean without flinching and let the other person respond.

With this placement, the money wound often shows up as under-charging, over-delivering, or avoiding money conversations entirely. You might be brilliant at earning but terrible at asking. You might build extraordinary things and then price them as though your voice does not deserve to take up space in the market.

===SECTION_2D_CALLOUT_TITLE===
THE VALUE PATTERN

===SECTION_2D_CALLOUT_BODY===
The amount you charge is often directly related to how safe your voice feels saying the number out loud. If you wince when you say your price, the wound is in the room.

===SECTION_2D_BODY2===
The money healing for this placement is not about manifesting abundance. It is about practicing the sentence: "This is what it costs." Without apologizing. Without explaining. Without offering a discount before anyone asked for one.

===SECTION_2E_TITLE===
CAREER + WORK

===SECTION_2E_SUBTITLE===
Where the voice meets authority

===SECTION_2E_SUBHEADER===
THE PROFESSIONAL WOUND

===SECTION_2E_BODY===
In your career, this Chiron placement creates someone who is often the most perceptive person in the room — and the last one to speak. You see what others miss. You can articulate complex ideas with precision. You know exactly what needs to be said in meetings, pitches, and negotiations. But there is a half-second delay between knowing and saying, and in that half-second, the wound runs its calculation: is it safe?

This can show up as the career pattern of being passed over — not because of a lack of talent, but because the voice hesitates at the exact moment when visibility requires it to land. Someone else says the thing you were thinking. Someone else gets credit for the idea you did not voice quickly enough.

===SECTION_2E_CALLOUT_TITLE===
THE CAREER EDGE

===SECTION_2E_CALLOUT_BODY===
Your career differentiator is your ability to say what nobody else in the room can articulate. The wound delays the voice. The healing is learning to trust it before it feels safe.

===SECTION_2E_BODY2===
The career healing for this placement looks like speaking first instead of last. Pitching the idea before it is perfect. Sending the email before you have rewritten it four times. The voice gets stronger by being used, not by being rehearsed.

===SECTION_2F_TITLE===
VISIBILITY + EXPRESSION

===SECTION_2F_SUBTITLE===
Where the voice meets the world

===SECTION_2F_SUBHEADER===
THE VISIBILITY WOUND

===SECTION_2F_BODY===
Visibility is the final frontier for this placement. You may be comfortable being known in small rooms — the trusted advisor, the wise friend, the person people come to. But scaling the voice — putting it on a stage, a platform, a page — can activate the wound at full volume.

The visibility fear with this placement is not about audiences. It is about permanence. A conversation can be adjusted in real time. A podcast, a book, a post — those live forever. And the wound whispers: what if you are misunderstood at scale?

===SECTION_2F_CALLOUT_TITLE===
THE VISIBILITY EDGE

===SECTION_2F_CALLOUT_BODY===
The thing the wound is most afraid of — being fully heard by a large audience — is also the thing the gift is designed for. The voice that learned to translate complex emotion into language is exactly the voice the world is waiting for.

===SECTION_2F_BODY2===
The visibility healing is not about becoming louder. It is about becoming less edited. Let the audience hear the version of you that exists before the wound gets to it. That version is more compelling than anything the protection could engineer.

===SECTION_3_DIVIDER_LABEL===
THE OTHER SIDE OF THE COIN

===SECTION_3_DIVIDER_DESCRIPTION===
The wound is not the end of the story. It is the beginning of the power. Everything the shadow built to protect you also built something extraordinary.

===SECTION_3A_TITLE===
THE OTHER SIDE OF THE COIN

===SECTION_3A_SUBTITLE===
Your wound built your greatest gift

===SECTION_3A_SUBHEADER===
THE CHIRON GIFT

===SECTION_3A_BODY===
Here is the part that changes everything: the wound and the gift are the same thing. The hypervigilance that makes you scan every room before speaking? That is the same skill that makes you an extraordinary communicator. The sensitivity that makes misunderstanding feel devastating? That is what makes your words land with precision when you let them fly.

===SECTION_3A_GRID===
PRECISION|||You choose words with the kind of care that most people reserve for legal documents. This is not overthinking. It is craftsmanship. The wound made you a wordsmith.
EMOTIONAL TRANSLATION|||You can take a feeling that someone has been sitting with for years and give it a sentence. People feel seen by you because you speak their experience back to them in language they could not find alone.
ROOM READING|||You walk into a room and know its emotional temperature in three seconds. This skill, born from survival, is now your superpower in every meeting, conversation, and relationship.
THE BRIDGE|||You are the person who can translate between people who do not speak the same emotional language. Mediator. Counselor. The one who makes the room make sense.

===SECTION_3A_CALLOUT_TITLE===
THE GOLD

===SECTION_3A_CALLOUT_BODY===
The wound that taught you to be careful with your words also taught you to be masterful with them. The same sensitivity that makes you afraid of being misunderstood is the sensitivity that allows you to say things nobody else can say. That is not a coincidence. That is Chiron.

===SECTION_3A_BODY2===
The healing does not require you to stop being careful. It requires you to use the care intentionally instead of letting the wound use it defensively. The skill is already built. The only thing that changes is who is driving.

===SECTION_3B_TITLE===
YOUR CAREER DIFFERENTIATOR

===SECTION_3B_SUBTITLE===
The professional edge the wound gave you

===SECTION_3B_SUBHEADER===
WHAT THE MARKET PAYS FOR

===SECTION_3B_BODY===
Every career differentiator you have was forged in the wound. The ability to articulate what others cannot? Built by years of translating yourself to be understood. The ability to hold space for difficult conversations? Built by years of navigating rooms where the wrong word had real consequences.

===SECTION_3B_GRID===
THE ARTICULATOR|||You can say in one sentence what it takes most people a paragraph to approximate. Boardrooms, stages, and sales conversations reward this.
THE SAFE SPACE|||People trust you with their vulnerability because your wound taught you what it costs to not be heard. You create the room you always needed.
THE STRATEGIST|||You see the full chessboard of a conversation. You know what to say, when to say it, and what to hold back. This is strategic intelligence born from emotional survival.
THE CLOSER|||When the voice finally trusts itself, it becomes the most compelling thing in the room. Not louder. More precise. That is what closes deals, books, pitches, and hearts.

===SECTION_3B_CALLOUT_TITLE===
THE CAREER GOLD

===SECTION_3B_CALLOUT_BODY===
Your professional value is not in spite of the wound. It is because of it. The market pays premium for people who can make the complex feel simple and the uncomfortable feel safe. That is your entire skill set.

===SECTION_3B_BODY2===
The career move for this placement is to stop apologizing for the very thing that makes you exceptional. Your sensitivity is not a liability. Your precision is not overthinking. Your voice is not too much. It is the product.

===SECTION_3C_TITLE===
WEALTH + RECOGNITION

===SECTION_3C_SUBTITLE===
Where the gift meets the market

===SECTION_3C_SUBHEADER===
THE ABUNDANCE PATTERN

===SECTION_3C_BODY===
Wealth for this placement is directly connected to the voice. The more fully you use it, the more the market responds. This is not a metaphor. The industries that pay the most for this Chiron gift are the ones that require exactly what the wound trained you to do.

===SECTION_3C_GRID===
WRITING|||The wound made you a careful, precise, emotionally intelligent writer. Books, copy, content, and communication strategy are natural monetization paths.
SPEAKING|||Coaching, consulting, facilitation, podcasting, teaching — any role where the voice is the vehicle is where this Chiron prints money.
HEALING|||Therapy, coaching, spiritual work, group facilitation — the wound that taught you to hold space is the same wound that qualifies you to hold it professionally.
LEADERSHIP|||The ability to name what is happening in a room, say the hard thing with compassion, and translate between competing perspectives is the definition of leadership.
MEDIA|||The voice that was silenced often becomes the voice people cannot stop listening to. Media presence, brand voice, and public communication are power channels.
STRATEGY|||Your ability to read rooms, anticipate reactions, and choose the perfect word at the perfect time makes you an invaluable strategist in any organization.

===SECTION_3C_CALLOUT_TITLE===
THE WEALTH KEY

===SECTION_3C_CALLOUT_BODY===
The thing you were once afraid to say out loud is the thing the market is waiting to pay for. Your voice is not your vulnerability. It is your product line.

===SECTION_3C_BODY2===
Start by naming your value in the rooms where it matters. Not louder. Just first. The voice that goes first sets the price. The voice that waits accepts whatever is offered.

===SECTION_4_DIVIDER_LABEL===
INTEGRATION

===SECTION_4_DIVIDER_DESCRIPTION===
You have the map. Now catch the pattern in real life, interrupt the old script, and let the wound become the teacher instead of the driver.

===SECTION_4A_TITLE===
TRIGGERS ARE PORTALS

===SECTION_4A_SUBTITLE===
How to use the activation instead of running from it

===SECTION_4A_SUBHEADER===
THE PRACTICE

===SECTION_4A_BODY===
Every trigger is a real-time invitation to respond differently. Not perfectly. Just differently. The wound will still fire. The protection will still activate. The goal is not to prevent the reaction — it is to notice it, name it, and choose the next move consciously instead of automatically.

Here is the practice: when you feel the trigger — the throat tightening, the words pulling back, the urge to edit or go quiet or perform — pause. Breathe. Name what is happening: "This is the wound." Then choose one thing to do differently. Say the sentence you were about to edit. Stay in the conversation five seconds longer than the protection wants to. Let the silence sit without filling it.

===SECTION_4A_CALLOUT_TITLE===
THE FIVE-SECOND RULE

===SECTION_4A_CALLOUT_BODY===
The wound makes its move in the first five seconds after activation. If you can notice the pattern in that window — just notice it — you have already changed the outcome. You do not need to be perfect. You need to be five seconds more aware than you were yesterday.

===SECTION_4A_BODY2===
Over time, this practice rewires the pattern. Not by fighting it, but by interrupting it at the moment of choice. The wound learns that the voice can speak and the world does not end. That is not a cognitive insight. It is a nervous system update. And it only happens through repetition.

===SECTION_4B_TITLE===
JOURNAL IT

===SECTION_4B_SUBTITLE===
Prompts to help the pattern become conscious

===SECTION_4B_SUBHEADER===
PAGE ONE

===SECTION_4B_CALLOUT1_TITLE===
PROMPT 1: THE FIRST SILENCE

===SECTION_4B_CALLOUT1_BODY===
Think of the earliest memory you have of going quiet when you had something to say. Where were you? Who was in the room? What did you want to say? What did you say instead? Write it all down — not to analyze it, but to let it exist outside your head for the first time.

===SECTION_4B_CALLOUT2_TITLE===
PROMPT 2: THE CURRENT EDIT

===SECTION_4B_CALLOUT2_BODY===
Name one thing you are currently not saying to someone important in your life. What is the unedited version? What is the version you would actually deliver? Notice the gap between the two. That gap is the wound's territory.

===SECTION_4B_CALLOUT3_TITLE===
PROMPT 3: THE VOICE UNLEASHED

===SECTION_4B_CALLOUT3_BODY===
If your voice had absolutely no consequences — nobody would be hurt, offended, confused, or disappointed — what would you say? To whom? Write the version that has no filter. Let it be messy. Let it be too much. That is the voice underneath the wound.

===SECTION_4C_TITLE===
JOURNAL IT

===SECTION_4C_SUBTITLE===
Continued reflections

===SECTION_4C_SUBHEADER===
PAGE TWO

===SECTION_4C_CALLOUT1_TITLE===
PROMPT 4: THE BODY MAP

===SECTION_4C_CALLOUT1_BODY===
Where does the wound live in your body? Close your eyes and think about the last time you held something back in a conversation. Where did the tension go? Throat? Jaw? Chest? Stomach? Write a letter to that part of your body. Tell it what it has been holding and what you are ready to release.

===SECTION_4C_CALLOUT2_TITLE===
PROMPT 5: THE PROTECTION'S RETIREMENT LETTER

===SECTION_4C_CALLOUT2_BODY===
Write a letter to the protection pattern that has served you the longest — the one that reads the room, goes quiet, over-explains, or makes it funny. Thank it. Acknowledge what it saved you from. Then tell it what you are ready to do differently.

===SECTION_4C_CALLOUT3_TITLE===
PROMPT 6: THE VOICE RECLAIMED

===SECTION_4C_CALLOUT3_BODY===
Describe the version of you that speaks without the wound driving. What does that person sound like in a meeting? In an argument? In bed? On a stage? Write the scene. Make it specific. Let your nervous system rehearse the future instead of replaying the past.

===SECTION_5_DIVIDER_LABEL===
CHIRON CHEAT SHEETS

===SECTION_5_DIVIDER_DESCRIPTION===
Every Chiron has a tender spot and a hidden gift. Use these cheat sheets to understand the people you love — and to meet their wound with the compassion yours taught you.

===SECTION_5A_TITLE===
CHIRON BY SIGN

===SECTION_5A_TABLE===
Aries|||Identity, selfhood, the right to exist and take up space
Taurus|||Security, self-worth, the body, and the relationship with material stability
Gemini|||Communication, being heard, understood, and believed
Cancer|||Emotional safety, nurturing, belonging, and the mother wound
Leo|||Visibility, self-expression, creativity, and the fear of being seen
Virgo|||Perfection, self-criticism, service, and never feeling good enough
Libra|||Relationships, fairness, people-pleasing, and losing yourself in others
Scorpio|||Trust, power, intimacy, vulnerability, and the fear of betrayal
Sagittarius|||Belief systems, meaning, freedom, and the search for truth
Capricorn|||Authority, achievement, legacy, and the father wound
Aquarius|||Belonging, individuality, feeling like an outsider, and the wound of not fitting in
Pisces|||Boundaries, spiritual bypassing, escapism, and the wound of being too much or not enough

===SECTION_5B_TITLE===
CHIRON BY HOUSE

===SECTION_5B_TABLE===
1st House|||Self-image, physical body, first impressions, and the way you present yourself to the world
2nd House|||Money, possessions, self-worth, and the relationship between value and identity
3rd House|||Communication, siblings, learning, and the local environment
4th House|||Home, family, roots, emotional foundation, and the parent who shaped your inner world
5th House|||Creativity, romance, children, joy, and the fear of self-expression
6th House|||Health, daily routine, work habits, service, and the wound of never doing enough
7th House|||Partnerships, marriage, one-on-one relationships, and the patterns you project onto others
8th House|||Shared resources, sexuality, transformation, death, and inherited trauma
9th House|||Higher education, travel, philosophy, religion, and the wound of meaninglessness
10th House|||Career, public reputation, authority, and the pressure to achieve
11th House|||Community, social groups, hopes, dreams, and the wound of not belonging
12th House|||The unconscious, isolation, spirituality, and the wound you cannot name

===SECTION_5C_TITLE===
HOW TO LOVE SOMEONE THROUGH THEIR CHIRON

===SECTION_5C_SUBTITLE===
Meeting the wound with what it actually needs

===SECTION_5C_SUBHEADER===
THE COMPASSION CHEAT SHEET

===SECTION_5C_BODY===
Once you understand your own Chiron, you will start recognizing it in everyone. The friend who over-explains everything? Chiron in Gemini. The partner who cannot accept a compliment? Chiron in Leo. The parent who controls everything? Chiron in Capricorn. Here is how to meet each wound with what it actually needs.

===SECTION_5C_TABLE===
Aries|||Let them take the lead sometimes. Do not fix their problems unless they ask. Remind them they are allowed to exist without justifying it.
Taurus|||Do not rush them. Respect their pace and their need for stability. Reassure them that they are enough without producing anything.
Gemini|||Listen. Really listen. Do not interrupt, correct, or rephrase what they said. Let them finish. Then say: I hear you.
Cancer|||Create emotional safety. Be consistent. Do not withdraw affection as punishment. Let them feel at home with you.
Leo|||See them. Celebrate them. Do not dim their light because it makes you uncomfortable. Let them shine without making it about you.
Virgo|||Tell them they are enough, right now, as they are. Do not add a "but." Do not suggest improvements. Just: enough.
Libra|||Do not let them disappear into your preferences. Ask what they actually want. Hold space for their opinion even when it disagrees with yours.
Scorpio|||Be trustworthy. Do not betray their confidence, even in small ways. Let them control the pace of vulnerability. Do not force openness.
Sagittarius|||Do not box them in. Respect their need for meaning and freedom. Engage with their ideas even when they seem impractical.
Capricorn|||Acknowledge their effort. Do not only praise results. Let them rest without earning it. Remind them that their value is not their output.
Aquarius|||Do not ask them to be normal. Celebrate the weird. Include them without requiring them to conform. Let them belong on their own terms.
Pisces|||Set boundaries with love. Do not enable their escape patterns. Ground them gently. Remind them that being present is safe.

===SECTION_5D_TITLE===
YOUR MAP IS NOT THE DESTINATION

===SECTION_5D_SUBTITLE===
A final word from the other side of the wound

===SECTION_5D_SUBHEADER===
CLOSING

===SECTION_5D_BODY===
This report is a mirror, not a verdict. It shows you where the wound lives, how it moves, and what it built — but it does not define where you go from here. That part is yours.

The wound will not disappear. That is not how Chiron works. But it will soften. The triggers will still fire, but you will catch them faster. The protection will still activate, but you will choose consciously instead of automatically. The voice that once went quiet will start to trust itself — not because the world became safer, but because you did.

Read this report again in a month. Underline the sentences that still sting. Those are the ones that are still working on you. Then put it down and go live the messy, beautiful, imperfect version of what it looks like when the wound stops driving and the gift takes the wheel.

===SECTION_5D_CALLOUT_TITLE===
ONE LAST THING

===SECTION_5D_CALLOUT_BODY===
The thing that hurt you the most is also the thing that qualifies you to help other people survive the same wound. That is not poetic. That is Chiron. And it is already working.

===SECTION_5D_SIGNOFF===
Love, light, and black holes,

Morgan

hello@lovelightandblackholes.com
@lovelightandblackholes`

export default function TestPdf() {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [pages, setPages] = useState(null)

  const generatePdf = async () => {
    setStatus('generating')
    setError(null)

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/generate-pdf`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            name: 'Morgan Garza',
            email: 'test@example.com',
            chironSign: 'Gemini',
            chironHouse: '4th House',
            chironDegree: '14°',
            shadowId: 'test-preview',
            report: SAMPLE_REPORT,
          }),
        }
      )

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || `Server returned ${response.status}`)
      }

      const data = await response.json()
      setPages(data.pages)

      const byteChars = atob(data.pdfBase64)
      const byteArray = new Uint8Array(byteChars.length)
      for (let i = 0; i < byteChars.length; i++) {
        byteArray[i] = byteChars.charCodeAt(i)
      }
      const blob = new Blob([byteArray], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = 'shadow-map-test-preview.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setStatus('done')
    } catch (err) {
      console.error('PDF generation failed:', err)
      setError(err.message)
      setStatus('error')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1E2220',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      padding: '20px',
    }}>
      <div style={{
        background: '#2a2e2c',
        borderRadius: '16px',
        padding: '48px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        border: '1px solid #3a3e3c',
      }}>
        <h1 style={{
          color: '#C3CD42',
          fontSize: '24px',
          fontWeight: 700,
          marginBottom: '8px',
        }}>
          PDF Preview Tool
        </h1>
        <p style={{
          color: '#999',
          fontSize: '14px',
          marginBottom: '32px',
        }}>
          Generates a full 26-page Shadow Map PDF with test data
        </p>

        <div style={{
          background: '#1E2220',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          textAlign: 'left',
        }}>
          <p style={{ color: '#aaa', fontSize: '13px', margin: '0 0 4px' }}>
            <span style={{ color: '#C3CD42' }}>Name:</span> Morgan Garza
          </p>
          <p style={{ color: '#aaa', fontSize: '13px', margin: '0 0 4px' }}>
            <span style={{ color: '#C3CD42' }}>Chiron:</span> Gemini, 4th House
          </p>
          <p style={{ color: '#aaa', fontSize: '13px', margin: '0 0 4px' }}>
            <span style={{ color: '#C3CD42' }}>Wound:</span> "The Unheard Voice"
          </p>
          <p style={{ color: '#aaa', fontSize: '13px', margin: 0 }}>
            <span style={{ color: '#C3CD42' }}>Template:</span> Full 26-page report (all 5 sections + cheat sheets)
          </p>
        </div>

        <button
          onClick={generatePdf}
          disabled={status === 'generating'}
          style={{
            background: status === 'generating' ? '#666' : '#C3CD42',
            color: '#1E2220',
            border: 'none',
            borderRadius: '8px',
            padding: '14px 32px',
            fontSize: '16px',
            fontWeight: 700,
            cursor: status === 'generating' ? 'wait' : 'pointer',
            width: '100%',
            transition: 'all 0.2s',
            opacity: status === 'generating' ? 0.7 : 1,
          }}
        >
          {status === 'generating'
            ? 'Generating PDF...'
            : status === 'done'
              ? 'Generate Again'
              : 'Generate Test PDF'}
        </button>

        {status === 'generating' && (
          <p style={{ color: '#999', fontSize: '13px', marginTop: '16px' }}>
            Building all 26 pages — this may take 15-20 seconds...
          </p>
        )}

        {status === 'done' && (
          <p style={{ color: '#C3CD42', fontSize: '14px', marginTop: '16px' }}>
            PDF downloaded! {pages && `(${pages} pages)`}
          </p>
        )}

        {status === 'error' && (
          <p style={{ color: '#e57373', fontSize: '14px', marginTop: '16px' }}>
            Something went wrong: {error}
          </p>
        )}

        <p style={{
          color: '#555',
          fontSize: '11px',
          marginTop: '32px',
        }}>
          This page is for internal testing only.
        </p>
      </div>
    </div>
  )
}
