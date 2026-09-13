// Lightweight i18n for the public site (index, register, confirm pages).
// Usage in HTML:
//   data-i18n="key"            -> sets textContent
//   data-i18n-html="key"       -> sets innerHTML (translation may contain <br>/<span>)
//   data-i18n-placeholder="key"-> sets the placeholder attribute
// Usage in JS (script.js / confirm.js):
//   HW_I18N.t("some.key")      -> translated string for the current language
//   document.addEventListener("hw:langchange", (e) => { ... e.detail.lang ... })
(function () {
  const STORAGE_KEY = "hw_lang";

  const TRANSLATIONS = {
    en: {
      "nav.how": "How it works",
      "nav.registerNow": "Register Now",
      "nav.home": "HOME",
      "nav.benefits": "BENEFITS",
      "nav.howItWorks": "HOW IT WORKS",
      "nav.requirements": "REQUIREMENTS",

      "footer.tagline": "Become part of something BIG.",
      "footer.quickLinks": "Quick Links",
      "footer.contact": "Contact",
      "footer.rights": "All rights reserved.",

      "hero.badgeEyebrow": "Verified & Licensed",
      "hero.badgeMain": "Ethiopian Illuminati — Licensed Recruitment Agency",
      "hero.headline": 'Welcome to the Ethiopian <br><span class="accent">Illuminati Society.</span>',
      "hero.lede": "We appreciate your interest in our organization. Explore our history, beliefs, principles, members, archives, and vision for the future. Learn more about our philosophy, discover our messages, and find information about membership and how to connect with us.",
      "hero.registerCta": "Register Now",
      "hero.seeHow": "See how it works",

      "stats.workersPlaced": "Members",
      "stats.employerPartners": "Partners",
      "stats.feeToRegister": "Fee to register",
      "stats.sectorsHiring": "Participants",

      "benefits.whyjoin": "Why Join Ethiopian Illuminati",

      "benefits.intro":
      "There are many benefits that come with Illuminati membership. These benefits include economic and social opportunities, valuable connections, and access to various resources. Our ultimate goal is to create positive change and contribute to a better future.",

      "benefits.power.title": "Power",
      "benefits.power.text":
      "Once confirmed to our ranks, we’ll grant you mystical powers. Words as power. You’ll use specific words to achieve supernatural results. You’ll use specific rituals to influence spiritual forces. We’ll also empower you to use esoteric language and magical phrases to get your way.",

      "benefits.talent.title": "Talent",
      "benefits.talent.text":
      "The Illuminati Society is passionate about talent development. Common fields include music, acting, modelling, sports, and more. We assign mentors to each of our members to guide them to stardom. Many of our members perform exceptionally well, globally.",

      "benefits.health.title": "Health",
      "benefits.health.text":
      "Your Illuminati membership comes packed with great health benefits. Our members enjoy holistic healthcare, insurance coverage, access to medical professionals, personalized care, and quality health facilities.",

      "benefits.money.title": "Money",
      "benefits.money.text":
      "Money is a mathematical measurement of a person's earthly influence. The standard benefits that every confirmed member receives are composed of two payments: Welcome Pay and Status Pay, plus other perks and non-monetary benefits.",

      "benefits.travel.title": "Travel",
      "benefits.travel.text":
      "As a confirmed member, you'll enjoy unique travel experiences, exclusive locations, exceptional services, bespoke itineraries, and luxury transportation.",

      "benefits.knowledge.title": "Knowledge",
      "benefits.knowledge.text":
      "Upon your full acceptance, we’ll teach you techniques designed to enhance understanding, memory, concentration, and learning abilities.",

     "how.title": "How It Works",

     "how.step1Title": "Register",
    "how.step1.item1": "Register now.",
     "how.step1.item2": "Fill all questions.",
     "how.step1.item3": "Upload self photo.",
     "how.step1.item4": "ID verification.",
      "how.step1.item5": "Upload receipt.",

      "how.step2Title": "Confirmation",
       "how.step2.item1": "Copy the link and save it anywhere.",
      "how.step2.item2": "Open it in any browser, anytime.",
       "how.step2.item3": "Open registration status.",
        "how.step2.item4": "View profile / status.",

     "how.step3Title": "Sacrifice",
     "how.step3.item1": "Choose an animal for sacrifice.",
      "how.step3.item2": "View details.",
      "how.step3.item3": "Pay the payment.",
      "how.step3.item4": "Upload receipt.",

      "requirements.title": "Requirements to Apply",

    "requirements.item1": "Be at least 16 years old and of good character.",
    "requirements.item2": "Have a valid national ID or passport.",
    "requirements.item3": "Join voluntarily, without pressure from others.",
    "requirements.item4": "Believe in a Supreme Being.",
    "requirements.item5": "Have a positive interest in the organization.",
    "requirements.item6": "Seek knowledge and respect its traditions.",
   "requirements.item7": "Join for reasons beyond personal profit.",
   "requirements.item8": "Be a peaceful, law-abiding citizen.",
      
     "cta.title": "Ready to register?",
   "cta.text": "Takes about four minutes. You can update your details any time.",
   "cta.button": "Register Now",
      "register.kicker": "Membership registration",
      "register.headline": "Let you get your profile <br> in front of Ethiopian<br> Illuminati society.",
      "register.lede": "Fields marked * are required.",

      "form.fullName": "Full name *",
      "form.phone": "Phone number *",
      "form.email": "Email",
      "form.dob": "Date of birth *",
      "form.gender": "Gender",
      "gender.preferNot": "Prefer not to say",
      "gender.female": "Female",
      "gender.male": "Male",
      "gender.other": "Other",
      "form.location": "City / region *",
      "form.photo": "Profile photo *",
      "upload.click": "Click to upload",
      "upload.change": "Change",
      "upload.remove": "Remove",
      "form.idDocumentFront": "ID document — front *",
      "form.idDocumentBack": "ID document — back *",
      "hint.acceptedFiles": "Accepted: JPG, PNG, or PDF. Max 5MB each.",
      "hint.acceptedFileSingle": "Accepted: JPG, PNG, or PDF. Max 5MB.",
      "form.receipt": "Registration fee payment receipt *",
      "payment.title": "Send the registration fee to:",
      "payment.bank": "Bank",
      "payment.accountName": "Account name",
      "payment.accountNumber": "Account number",
      "payment.loading": "Loading…",
      "payment.unavailable": "Unavailable — contact us",
      "payment.uploadHint": "Upload proof of payment below after sending.",
      "form.consent": "I agree to be contacted by Ethiopian Illuminati society.",
      "form.fingerprintHint": "Press and hold to verify your identity",
      "form.fingerprintVerified": "Identity verified",
      "form.submit": "Submit Registration",
      "form.submitting": "Submitting...",
      "form.uploading": "Uploading...",
      "resume.message": "You started a registration earlier and didn't finish. Continue where you left off?",
      "resume.continue": "Continue",
      "resume.startOver": "Start over",
      "resume.alreadyUploaded": "Already uploaded ✓",
      "lastReg.message": "You already have a registration with us.",
      "lastReg.viewStatus": "View my status",
      "status.fileTooLarge": "Each file must be under 5MB.",
      "status.submitError": "Something went wrong submitting your registration. Please try again.",
      "status.duplicatePhone": "This phone number is already registered. If you need to update your details, contact us instead of registering again.",

      "confirm.received": "Registration received",
      "confirm.title": "You're in the system.",
      "confirm.lede": "Save this link — it's the only way to check your status later. If you gave an email, we'll also send it to you.",
      "confirm.linkLabel": "Your registration link",
      "confirm.copy": "Copy",
      "confirm.copied": "Link copied.",
      "confirm.copyManual": "Select the link above and copy it manually.",
      "confirm.openLink": "Open my profile",

      "confirmPage.loading": "Loading your registration…",
      "confirmPage.missingCode": "This link is missing its registration code.",
      "confirmPage.notFound": "We couldn't find a registration for this link. Double-check you copied it in full.",
      "confirmPage.loadError": "Something went wrong loading your registration. Please try again later.",
      "confirmPage.receivedKicker": "Registration received",
      "confirmPage.underReview": "Under review",
      "confirmPage.submittedOn": "Submitted on",
      "confirmPage.reviewingNote": "Our team is reviewing your submission. You'll get an email once it's confirmed.",
      "confirmPage.confirmedKicker": "Registration confirmed",
      "confirmPage.youreRegistered": "You're registered! \u{1F389}",
      "confirmPage.registeredOn": "Registered on",
      "confirmPage.disclaimerConfirmed": "This confirms your registration is in our system.",
      "confirmPage.viewJobsCta": "Offer a sacrifice",

      "openings.kicker": "sacrifices",
      "openings.title": "sacrifices offered today",
      "openings.viewDetails": "View details",
      "openings.hideDetails": "Hide details",
      "openings.postedOn": "Posted",
      "openings.loading": "Loading job openings…",
      "openings.loadError": "Couldn't load job openings. Try refreshing.",
      "openings.empty": "No job openings right now — check back soon.",
      "openings.gateMissingToken": "This page is only available through your registration's approval link.",
      "openings.gateNotApproved": "Your registration isn't approved yet — you'll be able to browse jobs once it is.",
      "openings.gateInvalid": "We couldn't verify your registration. Double-check the link you used, or register below.",
      "openings.gateRegisterCta": "Register now",

      "status.new": "Registered — awaiting review",
      "status.contacted": "You've been contacted",
      "status.placed": "Placed with an employer",
      "status.rejected": "Not currently proceeding",
    },

    am: {
      "nav.how": "እንዴት እንደሚሰራ",
      "nav.registerNow": "አሁን ይመዝገቡ",
      "nav.home": "መነሻ",
      "nav.benefits": "ጥቅሞች",
      "nav.howItWorks": "እንዴት እንደሚሰራ",
      "nav.requirements": "መስፈርቶች",

      "footer.tagline": "የታላቅ ዓላማና ራዕይ አካል ይሁኑ፤ ከራስዎ በላይ የሆነ ትልቅ ነገርን በጋራ ለመገንባት የሚያበረታታ ልዩ ማኅበረሰብ አካል ይሁኑ።",
      "footer.quickLinks": "ፈጣን አገናኞች",
      "footer.contact": "አድራሻ",
      "footer.rights": "መብቱ በህግ የተጠበቀ ነው።",

      "hero.badgeEyebrow": "የተረጋገጠ እና ፍቃድ ያለው",
      "hero.badgeMain": "በኢትዮጵያ ኢሉሚናቲ ፈቃድ ያለው የምልመላ ኤጀንሲ",
      "hero.headline": 'እንኳን ወደ ኢትዮጵያዊ ኢሉሚናቲ<br><span class="accent">ማህበር በደህና መጡ።</span>',
      "hero.lede": "ድርጅታችንን ለመቀላቀል ላሳዩት ፍላጎት እናመሰግናለን። ስለ ታሪካችን፣ እምነቶቻችን፣ መርሆቻችን፣ አባላቶቻችን፣ ማህደሮቻችን እና የወደፊት ራዕያችን የበለጠ ይወቁ። ስለ ፍልስፍናችን የበለጠ ይማሩ፣ መልዕክቶቻችንን ያግኙ፣ እንዲሁም ስለ አባልነት እና እኛን ለማግኘት ስለሚቻሉ መንገዶች መረጃ ያግኙ።",
      "hero.registerCta": "አሁን ይመዝገቡ",
      "hero.seeHow": "እንዴት እንደሚሰራ ይመልከቱ",

      "stats.workersPlaced": "የአባሎች ብዛት",
      "stats.employerPartners": "አጋሮች",
      "stats.feeToRegister": "የምዝገባ ክፍያ",
      "stats.sectorsHiring": "በመመዝገብ ላይ",

      "benefits.whyjoin": "ለምን የኢትዮጵያ ኢሉሚናቲን ይቀላቀላሉ?",

      "benefits.intro":
      "የኢሉሚናቲ አባልነት ከብዙ ጥቅሞች ጋር ይመጣል። እነዚህም የኢኮኖሚና የማህበራዊ እድሎች፣ ጠቃሚ ግንኙነቶች እና የተለያዩ ሀብቶችን ማግኘትን ያካትታሉ። የመጨረሻ ዓላማችን አዎንታዊ ለውጥ ማምጣት እና ለተሻለ ዓለም አስተዋጽኦ ማድረግ ነው።",

      "benefits.power.title": "ሀይል",
      
      "benefits.power.text":
      "አባልነትዎ አንዴ ከተረጋገጠ፣ ምስጢራዊ ኃይሎችን እንሰጥዎታለን። ቃላትን እንደ ኃይል ይጠቀማሉ። የተወሰኑ ቃላትን በመጠቀም ከተፈጥሮ በላይ የሆኑ ውጤቶችን ለማምጣት ይችላሉ። መንፈሳዊ ኃይሎችን ለመንካትና ተጽዕኖ ለማሳደር የተወሰኑ ሥርዓቶችን ይጠቀማሉ። እንዲሁም ኢሶቴሪክ ቋንቋንና አስማታዊ ሐረጎችን በመጠቀም የፈለጉትን ለማሳካት ኃይል እንሰጥዎታለን።",

      "benefits.talent.title": "ችሎታ",
      "benefits.talent.text":
      "የኢሉሚናቲ ማኅበር የግለሰቦችን ተፈጥሯዊ ችሎታና ክህሎት ለማዳበር ልዩ ትኩረት ይሰጣል። ከዋነኞቹ የችሎታ መስኮች መካከል ሙዚቃ፣ ትወና፣ ሞዴሊንግ፣ ስፖርት እና ሌሎች የፈጠራና የሙያ መስኮች ይገኙበታል።እያንዳንዱ አባል በተመደበለት አማካሪ ወይም መሪ በኩል ተገቢውን መመሪያና ድጋፍ እንዲያገኝ ይደረጋል፤ ይህም ችሎታውን በማሳደግ ወደ ስኬትና ዝና እንዲደርስ ለማገዝ ያለመ ነው። ብዙዎቹ የማኅበሩ አባላትም በዓለም አቀፍ ደረጃ ከፍተኛ ብቃትና አፈጻጸም እያሳዩ ይገኛሉ።",

       "benefits.health.title": "ጤና",
       "benefits.health.text":
       "የኢሉሚናቲ ማኅበር አባልነትዎ ከፍተኛ የጤና ጥቅሞችንና የተሟላ የጤና እንክብካቤ ዕድሎችን ያካትታል። አባላቱ የተቀናጀና ሁለንተናዊ የጤና እንክብካቤ፣ የኢንሹራንስ ሽፋን፣ ብቃት ያላቸውን የሕክምና ባለሙያዎች የማግኘት ዕድል፣ ለግለሰብ ፍላጎት የተስተካከለ የጤና እንክብካቤ እና ዘመናዊና ጥራት ያላቸውን የጤና ተቋማት የመጠቀም መብት ያገኛሉ።የእርስዎ ጤናና ደህንነት ቅድሚያ የሚሰጠው እሴት በመሆኑ፣ የኢሉሚናቲ ማኅበር አባልነት የተሻለ የጤና እንክብካቤና የተሟላ ድጋፍ ለማግኘት የተለየ ዕድል ያቀርባል።",

       "benefits.money.title": "ገንዘብ",
       "benefits.money.text":
       "ገንዘብ የአንድ ሰው በዓለማዊ ሕይወት ያለውን ተጽዕኖ በሒሳባዊ መለኪያ የሚያሳይ መጠን ነው። እያንዳንዱ በይፋ የተረጋገጠ አባል የሚያገኘው መደበኛ የአባልነት ጥቅም በሁለት ዋና የክፍያ ምድቦች የተዋቀረ ነው። እነሱም **የእንኳን ደህና መጡ ክፍያ (Welcome Pay)** እና **የደረጃ ክፍያ (Status Pay)** ናቸው።ከእነዚህ ዋና ጥቅሞች በተጨማሪ፣ አባላት ልዩ የጥቅማጥቅም አገልግሎቶችንና በገንዘብ ሊመዘኑ የማይችሉ ተጨማሪ የአባልነት ጥቅሞችን የማግኘት ዕድል ያገኛሉ። ይህ የተዋቀረ የጥቅማጥቅም ሥርዓት ለእያንዳንዱ የተረጋገጠ አባል ተጨማሪ የገንዘብና የግል ዕድገት ዕድሎችን ለማቅረብ ያለመ ነው።",

       "benefits.travel.title": "ጉዞ",
       "benefits.travel.text":
       "እንዴ በይፋ የተረጋገጠ አባል፣ ልዩና የማይረሱ የጉዞ ልምዶችን የማግኘት ዕድል ያገኛሉ፤ በተመረጡ ልዩ መዳረሻዎች መጎብኘት፣ ከፍተኛ ደረጃ ያላቸውን ልዩ አገልግሎቶች መጠቀም፣ እንደ ግለሰብ ፍላጎትዎ የተዘጋጁ የጉዞ ዕቅዶችን መከተል እና የቅንጦት የመጓጓዣ አገልግሎቶችን መጠቀም ያካትታል።",

       "benefits.knowledge.title": "እውቀት",
       "benefits.knowledge.text":
       "ሙሉ በሙሉ ከተቀበሉ በኋላ፣ የመረዳት ችሎታዎን፣ የማስታወስ አቅምዎን፣ ትኩረትዎን እና የመማር ችሎታዎን በማጠናከር የአእምሮ አቅምዎን ወደ ከፍተኛ ደረጃ ለማሳደግ የተነደፉ ልዩ ዘዴዎችንና ቴክኒኮችን እናስተምራችኋለን። እነዚህ የተመረጡ ሥልጠናዎች የእውቀት አጠቃቀምን፣ የአእምሮ ትኩረትን እና የመማር ብቃትን በማሻሻል የግል እድገትዎንና የአእምሮ አቅምዎን ለማጎልበት የተዘጋጁ ናቸው።",

     "how.title": "እንዴት ይሰራል?",

"how.step1Title": "ምዝገባ",
"how.step1.item1": "አሁን ይመዝገቡ።",
"how.step1.item2": "ሁሉንም ጥያቄዎች ይሙሉ።",
"how.step1.item3": "የራስዎን ፎቶ ያስገቡ።",
"how.step1.item4": "የመታወቂያ ማረጋገጫ ያስገቡ።",
"how.step1.item5": "የክፍያ ደረሰኝ ያስገቡ።",

"how.step2Title": "ማረጋገጫ",
"how.step2.item1": "ሊንኩን ቅዳ እና በማንኛውም ቦታ አስቀምጥ።",
"how.step2.item2": "በማንኛውም ጊዜ በማንኛውም ብራውዘር ይክፈቱት።",
"how.step2.item3": "የምዝገባ ሁኔታን ይክፈቱ።",
"how.step2.item4": "መገለጫ / ሁኔታ ይመልከቱ።",

"how.step3Title": "መስዋዕት",
"how.step3.item1": "ለመስዋዕት እንስሳ ይምረጡ።",
"how.step3.item2": "ዝርዝሩን ይመልከቱ።",
"how.step3.item3": "ክፍያውን ይክፈሉ።",
"how.step3.item4": "የክፍያ ደረሰኝ ያስገቡ።",

"requirements.title": "ለማመልከት የሚያስፈልጉ መስፈርቶች",

"requirements.item1": "ቢያንስ 16 ዓመት የሞላዎት እና ጥሩ ባህሪ ያለዎት መሆን አለብዎት።",
"requirements.item2": "የሚሰራ ብሔራዊ መታወቂያ ወይም ፓስፖርት ሊኖርዎት ይገባል።",
"requirements.item3": "ከሌሎች ሰዎች ጫና ውጭ በፈቃደኝነት መቀላቀል።",
"requirements.item4": "በከፍተኛ ፈጣሪነት ማመን።",
"requirements.item5": "ለድርጅቱ አዎንታዊ ፍላጎት መኖር።",
"requirements.item6": "እውቀትን መፈለግ እና ወጎቹን ማክበር።",
"requirements.item7": "ከግል ጥቅም በላይ በሆኑ ምክንያቶች መቀላቀል።",
"requirements.item8": "ሰላማዊ እና ሕግን የሚያከብር ዜጋ መሆን።",
      
      "cta.title": "ለመመዝገብ ዝግጁ ነዎት?",
      "cta.text": "ምዝገባው ወደ አራት ደቂቃ ያህል ይወስዳል። ዝርዝሮችዎን በማንኛውም ጊዜ ማዘመን ይችላሉ።",
      "cta.button": "አሁን ይመዝገቡ",

      "register.kicker": "የአባልነት ምዝገባ",
      "register.headline": "መረጃዎችዎን ለኢትዮጵያውያን <br>ኢሉሚናቲ ማህበር <br>አቅርብ።",
      "register.lede": "በ * የተመለከቱ መስኮች የግድ ያስፈልጋሉ። ።",

      "form.fullName": "ሙሉ ስም *",
      "form.phone": "ስልክ ቁጥር *",
      "form.email": "ኢሜይል",
      "form.dob": "የትውልድ ቀን *",
      "form.gender": "ጾታ",
      "gender.preferNot": "መናገር አልፈልግም",
      "gender.female": "ሴት",
      "gender.male": "ወንድ",
      "gender.other": "ሌላ",
      "form.location": "ከተማ / ክልል *",
      "form.photo": "የመገለጫ ፎቶ *",
      "upload.click": "ለመላክ ይጫኑ",
      "upload.change": "ቀይር",
      "upload.remove": "አስወግድ",
      "form.idDocumentFront": "መታወቂያ ሰነድ — ፊት *",
      "form.idDocumentBack": "መታወቂያ ሰነድ — ጀርባ *",
      "hint.acceptedFiles": "ተቀባይነት ያላቸው፦ JPG፣ PNG ወይም PDF። ከፍተኛ 5MB ለእያንዳንዱ።",
      "hint.acceptedFileSingle": "ተቀባይነት ያላቸው፦ JPG፣ PNG ወይም PDF። ከፍተኛ 5MB።",
      "form.receipt": "የምዝገባ ክፍያ ደረሰኝ *",
      "payment.title": "የምዝገባ ክፍያውን ወደዚህ ይላኩ፦",
      "payment.bank": "ባንክ",
      "payment.accountName": "የመለያ ስም",
      "payment.accountNumber": "የመለያ ቁጥር",
      "payment.loading": "በመጫን ላይ…",
      "payment.unavailable": "አይገኝም — እባክዎ ያግኙን",
      "payment.uploadHint": "ከላኩ በኋላ የክፍያ ማረጋገጫውን ከታች ይላኩ።",
      "form.consent": "በኢትዮጵያ ኢሉሚናቲ ማህበር እድሎች እንዲያገኙኝ እስማማለሁ።",
      "form.fingerprintHint": "ማንነትዎን ለማረጋገጥ ተጭነው ይያዙ",
      "form.fingerprintVerified": "ማንነት ተረጋግጧል",
      "form.submit": "ምዝገባ ላክ",
      "form.submitting": "በመላክ ላይ...",
      "form.uploading": "በመስቀል ላይ...",
      "resume.message": "ቀደም ብለው ምዝገባ ጀምረው አልጨረሱም። ካቆሙበት መቀጠል ይፈልጋሉ?",
      "resume.continue": "ይቀጥሉ",
      "resume.startOver": "እንደገና ይጀምሩ",
      "resume.alreadyUploaded": "ተልኳል ✓",
      "lastReg.message": "ቀደም ብለው ከእኛ ጋር ተመዝግበዋል።",
      "lastReg.viewStatus": "ሁኔታዬን ይመልከቱ",
      "status.fileTooLarge": "እያንዳንዱ ፋይል ከ5MB በታች መሆን አለበት።",
      "status.submitError": "ምዝገባዎን በመላክ ላይ ችግር ተፈጥሯል። እባክዎ እንደገና ይሞክሩ።",
      "status.duplicatePhone": "ይህ ስልክ ቁጥር አስቀድሞ ተመዝግቧል። መረጃዎን ማዘመን ካስፈለገዎት እንደገና ከመመዝገብ ይልቅ ያግኙን።",

      "confirm.received": "ምዝገባ ደርሷል",
      "confirm.title": "ሲስተሙ ውስጥ ገብተዋል።",
      "confirm.lede": "ይህን ሊንክ ኮፒ አርገው ያስቀምጡ — ሁኔታዎን በኋላ ለመከታተል ብቸኛው መንገድ ነው። ኢሜይል ከሰጡ፣ በ ኢሜል እንልክልዎታለን።",
      "confirm.linkLabel": "የምዝገባ ሊንክዎ",
      "confirm.copy": "ቅዳ",
      "confirm.copied": "ሊንኩ ተቀድቷል።",
      "confirm.copyManual": "ከላይ ያለውን ሊንክ ይምረጡ እና በእጅ ይቅዱት።",
      "confirm.openLink": "ፕሮፋይል ለማየት",

      "confirmPage.loading": "ምዝገባዎን በመጫን ላይ…",
      "confirmPage.missingCode": "ይህ ሊንክ የምዝገባ ኮዱ ጠፍቷል።",
      "confirmPage.notFound": "ለዚህ ሊንክ ምዝገባ አላገኘንም። ሙሉ በሙሉ መቅዳትዎን ያረጋግጡ።",
      "confirmPage.loadError": "ምዝገባዎን በመጫን ላይ ችግር ተፈጥሯል። እባክዎ ቆይተው እንደገና ይሞክሩ።",
      "confirmPage.receivedKicker": "ምዝገባ ደርሷል",
      "confirmPage.underReview": "በግምገማ ላይ",
      "confirmPage.submittedOn": "የቀረበበት ቀን",
      "confirmPage.reviewingNote": "ቡድናችን ማመልከቻዎን በመገምገም ላይ ነው። ከተረጋገጠ በኋላ ኢሜይል ይደርስዎታል።",
      "confirmPage.confirmedKicker": "ምዝገባ ተረጋግጧል",
      "confirmPage.youreRegistered": "ተመዝግበዋል! \u{1F389}",
      "confirmPage.registeredOn": "የተመዘገበበት ቀን",
      "confirmPage.disclaimerConfirmed": "ይህ ምዝገባዎ በሲስተማችን ውስጥ መኖሩን ያረጋግጣል።",
      "confirmPage.viewJobsCta": "መስዋት ለማቅረብ",

      "openings.kicker": "መስዋት",
      "openings.title": "አሁን ላይ ያሉ የመስዋት አይነቶች ።",
      "openings.viewDetails": "ዝርዝር ይመልከቱ",
      "openings.hideDetails": "ዝርዝር ደብቅ",
      "openings.uploadReceipt": "የመስዋት ደረሰኝ ይላኩ",
      "openings.receiptUploaded": "የመስዋት ደረሰኝ ተስቅሏል ✓",
      "openings.receiptUploading": "በመላክ ላይ…",
      "openings.receiptTooLarge": "ምስሉ በጣም ትልቅ ነው (ከፍተኛው 5ሜባ)።",
      "openings.receiptUploadError": "ደረሰኙን መስቀል አልተቻለም። እባክዎ እንደገና ይሞክሩ።",
      "openings.postedOn": "የተለጠፈው",
      "openings.loading": "ክፍት የስራ ቦታዎችን በመጫን ላይ…",
      "openings.loadError": "ክፍት የስራ ቦታዎችን መጫን አልተቻለም። እባክዎ ገጹን እንደገና ያድሱ።",
      "openings.empty": "በአሁኑ ጊዜ ክፍት የስራ ቦታ የለም — በቅርቡ ይመልከቱ።",
      "openings.gateMissingToken": "ይህ ገጽ የሚገኘው በምዝገባዎ የማጽደቅ ሊንክ በኩል ብቻ ነው።",
      "openings.gateNotApproved": "ምዝገባዎ እስካሁን አልጸደቀም — ከጸደቀ በኋላ ስራዎችን መመልከት ይችላሉ።",
      "openings.gateInvalid": "ምዝገባዎን ማረጋገጥ አልቻልንም። የተጠቀሙበትን ሊንክ ያረጋግጡ ወይም ከታች ይመዝገቡ።",
      "openings.gateRegisterCta": "አሁን ይመዝገቡ",

      "status.new": "ተመዝግቧል — በግምገማ እየተጠበቀ",
      "status.contacted": "ተገናኝተውዎታል",
      "status.placed": "ከአሰሪ ጋር ተመድበዋል",
      "status.rejected": "በአሁኑ ጊዜ እየቀጠለ አይደለም",
    },
  };

  function getLang() {
  const saved = localStorage.getItem(STORAGE_KEY);
  // Amharic is the default for first-time visitors.
  return saved === "en" ? "en" : "am";
}

  function t(key) {
    const lang = getLang();
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    return dict[key] !== undefined ? dict[key] : (TRANSLATIONS.en[key] !== undefined ? TRANSLATIONS.en[key] : key);
  }

  function applyLanguage(lang) {
    document.documentElement.setAttribute("lang", lang === "am" ? "am" : "en");

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      el.innerHTML = t(el.getAttribute("data-i18n-html"));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
    document.querySelectorAll(".lang-toggle").forEach((btn) => {
      btn.textContent = lang === "am" ? "EN" : "አማ";
      btn.setAttribute("aria-label", lang === "am" ? "Switch to English" : "ወደ አማርኛ ቀይር");
    });

    document.dispatchEvent(new CustomEvent("hw:langchange", { detail: { lang } }));
  }

  function setLang(lang) {
    const normalized = lang === "am" ? "am" : "en";
    localStorage.setItem(STORAGE_KEY, normalized);
    applyLanguage(normalized);
  }

  function init() {
    document.querySelectorAll(".lang-toggle").forEach((btn) => {
      btn.addEventListener("click", () => setLang(getLang() === "am" ? "en" : "am"));
    });
    applyLanguage(getLang());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.HW_I18N = { t, getLang, setLang };
})();
