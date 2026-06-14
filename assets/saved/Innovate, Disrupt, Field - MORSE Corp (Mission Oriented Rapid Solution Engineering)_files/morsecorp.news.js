function GetURLParameter(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }
}

function showNews() {
    let filteredPRs = null;
    if (prCategory === "all") {
        filteredPRs = morsePRs;
    } else {
        filteredPRs = morsePRs.filter(elem => {return elem.categories.includes(prCategory);});
    }
    
    $("#newsitems").empty();
    filteredPRs.forEach(elem => {
        $("#newsitems").append(
            '<div class="newsentrywrapper fadeIn animated"> \
            <div class="newsImage"> \
                <a href="pressrelease.html?prId=' + elem.prId + '"><img src="' + elem.image + '"> </a>\
            </div> \
            <div class="newsContainer"> \
                <a href="pressrelease.html?prId=' + elem.prId + '" class="lnk ">' + elem.title + '</a> \
                <p>' + elem.summary + ' </p> \
                <span class="newsmetadata"><time datetime="#">' + elem.date + '</time> <span class="separator"></span> <span id="author">' + elem.author + '</span> <span class="separator"></span> <span id="duration">' + elem.duration + '</span></span> \
            </div> \
        </div>');
    });
}

let morsePRs = [];
let prCategory = "all";
const prSignature = [
    '<b>About MORSE:</b> MORSE Corp (MORSECORP Inc.) is an employee owned, small business based in Cambridge, MA, Arlington, VA, and Seattle, WA with a history of fielding cutting-edge technology. MORSE boasts a specially selected team of scientists, engineers, and software developers to deliver best-in-class technical solutions that solve difficult multidisciplinary problems faced by the US National Security Ecosystem.',
    '<b>For inquiries, please contact:</b>',
    'Tyler Pearl<br>857-999-3077<br>tpearl@morsecorp.com'
]

morsePRs.push({
    prId: "pr_09_05_2025",
    title: 'MORSE Corp Wins Award for DARPA Albatross Program',
    date: "September 05, 2025",
    author: "MORSE Corp",
    duration: "1 minute read",
    categories: ["news"],
    image: "images/news/pr-albatross.jpg",
    summary: 'The Defense Advanced Research Project Agency (DARPA), Strategic Technology Office has awarded MORSE Corp a prime contract for its Albatross program.',
    content: [
        'The DARPA Albatross program aims to develop effective autonomous aircraft soaring capabilities leveraging weather forecast-informed mission planning and real-time onboard exploitation of dynamic environmental conditions to allow autonomous vehicles to fly farther and longer. MORSE will develop biomimetic technologies to actively harness energy from naturally occurring phenomena to reduce onboard aircraft power demand.',
        '&quot;This is a significant win for MORSE. Albatross is a program that combines a wide range of MORSE capabilities, including platform integration, autonomy, weather forecasting, mission planning, artificial intelligence, and flight testing,&quot; said MORSE Chief Technology Officer, Matt DiLeo. &quot;We are advancing the state-of-the–art, enhancing the efficiency and performance of planning and autonomy to provide a new extended-range aircraft capability to the US Department of Defense.&quot;',
        'For over 10 years, MORSE has developed novel, multi-disciplinary, unconventional solutions to provide the US warfighter an asymmetric advantage. Albatross aims to transition fundamental R&D to operational capabilities, redefining the boundaries of what is possible and enabling a new paradigm of systems warfare.',
        '<i>Approved for Public Release, Distribution Unlimited</i>'
        ].concat(prSignature)
    });

    morsePRs.push({
    prId: "pr_08_07_2025",
    title: 'MORSE Corp Awarded $48M US Army OTA for UAS Development',
    date: "August 07, 2025",
    author: "MORSE Corp",
    duration: "2 minute read",
    categories: ["news"],
    image: "images/news/pr-48M-army-ota.jpg",
    summary: 'MORSE Corp (MORSECORP Inc.) is proud to announce that it has been awarded a $48,054,384 firm-fixed-price Other Transaction Agreement (OTA) by the US Army Product Manager, Force Sustainment Systems (PM FSS) in Natick, MA.',
    content: [
        'Cambridge, MA. MORSE Corp (MORSECORP Inc.) is proud to announce that it has been awarded a $48,054,384 firm-fixed-price Other Transaction Agreement (OTA) by the US Army Product Manager, Force Sustainment Systems (PM FSS) in Natick, MA, to develop novel long range autonomous aircraft that can operate in GPS-denied Anti-Access/Area Denial (A2/AD) environments. This agreement’s five-year performance period will enable the Army to significantly enhance its Contested Logistics capabilities.',
        'In addition to development and rapid prototyping of novel unmanned aerial systems (UAS), this work will include advancements in GPS-denied navigation technologies, and an array of mission planning and execution tools. The work will culminate in a series of independent test and evaluation events and will transition into rapid scale up of initial manufacturing.',
        '&quot;MORSE prides itself on solving challenging aerospace problems, but very few systems in the aerospace world make it from prototype to production, and this contract enables that.&quot; says Adam Ray, Integrated Systems Portfolio Lead. &quot;This is a rare opportunity to see one of our UAS go from initial design to production, in such a short timeline. We are excited to help rapidly close a critical capability gap for the US Military.&quot;',
        'This contract award demonstrates MORSE Corp’s expertise in aircraft design, autonomy, rapid prototyping, human-machine teaming, and system integration. The resulting low-cost, long-range vehicle will enable critical sustainment activities in challenging regions such as INDOPACOM.',
        ].concat(prSignature)
    });

    morsePRs.push({
    prId: "pr_06_24_2025",
    title: 'MORSE Corp Achieves CMMC Level 2 Certification',
    date: "June 24, 2025",
    author: "MORSE Corp",
    duration: "2 minute read",
    categories: ["news"],
    image: "images/news/pr-morsecorp-CMMC.jpg",
    summary: 'MORSE Corp (MORSECORP Inc.) announced today the successful completion of its <b>Cybersecurity Maturity Model Certification (CMMC) Level 2 </b>assessment conducted by a Certified Third-Party Assessment Organization.',
    content: [
        'Cambridge, MA. MORSE Corp (MORSECORP Inc.) announced today the successful completion of its <b>Cybersecurity Maturity Model Certification (CMMC) Level 2 </b>assessment conducted by a Certified Third-Party Assessment Organization. MORSE passed the assessment with a perfect 110 score, with zero Plan of Action and Milestones (POA&Ms), and zero findings, reflecting a strong, integrated cybersecurity program.',
        'This milestone is a testament to MORSE&#39;s commitment to safeguarding Controlled Unclassified Information (CUI) and reinforces its position as a trusted partner to the Department of Defense (DoD) and its contracting partners.',
        '&quot;Passing this assessment with a perfect result is a testament not just to compliance, but to the culture of excellence we&#39;ve built across IT and Security,&quot; said Kuba Szwacki, Head of IT & Security. &quot;At MORSE, we have worked extremely hard to elevate our cybersecurity proficiency and now cybersecurity is a strategic capability that sets us apart. Our ability to deliver with speed, integrity, and confidence is rooted in the systems we&#39;ve built over the last several years and the MORSE team behind them.&quot;',
        'CMMC Level 2 requires full implementation of all the NIST 800-171 Rev. 2 security requirements and assessment objectives. The DoD will require all contractors to be CMMC certified. MORSE&#39;s cybersecurity approach has woven IT and cybersecurity best practices into every layer of its operations—from system architecture to employee behavior.',
        '&quot;We have built a system that supports rapid and agile development, enabling the company to solve complex and multidisciplinary problems for the US national security ecosystem,&quot; said Josh Torgerson, Chief Operating Officer. &quot;Cybersecurity doesn&#39;t have to stifle innovation.&quot;',
        'This achievement follows a series of successful internal audits, external assessments, and readiness reviews, solidifying the company&#39;s leadership in secure and reliable operations. With over 76,000 companies in the US Defense Industrial Base and less than 1% currently certified, MORSE joins a small group of DoD contractors that have successfully achieved final CMMC Level 2 certification.',
        ].concat(prSignature)
    });

    morsePRs.push({
    prId: "pr_06_06_2025",
    title: 'MORSE Corp Expands to a New Seattle, WA Office',
    date: "June 06, 2025",
    author: "MORSE Corp",
    duration: "2 minute read",
    categories: ["news", "culture"],
    image: "images/news/pr-seattle-wa_office.jpg",
    summary: 'MORSE Corp (MORSECORP Inc.) a leading defense technology company, is opening its first West Coast location with the launch of a new office in Seattle, WA.',
    content: [
        'Seattle, WA. MORSE Corp (MORSECORP Inc.) a leading defense technology company, is opening its first West Coast location with the launch of a new office in Seattle, WA. MORSE is headquartered in Cambridge, MA, and opened its first satellite office in Arlington, VA, in 2024. With steady growth, this geographical expansion will allow MORSE to have better proximity to customers and access to yet another strong technical talent pool.',
        '&quot;We are excited to join the vibrant tech community in Seattle,&quot; says Andreas Kellas, CEO of MORSE Corp. &quot;When we open a new office, we look for three key factors: an office leader who deeply understands ‘the MORSE way&quot;, proximity to customers, and an exceptional talent pool. Seattle checks off all three, and this new office will play a critical role in our company&#39;s continued growth and success.&quot;',
        'MORSE&#39;s Seattle office will be led by Eddy Scott, Division Leader and Portfolio Lead of Test Range Automation. Eddy joined MORSE in 2017, working in the Cambridge office before relocating to Seattle. &quot;Having seen MORSE grow from ten people to the company it is today, I couldn’t be more excited about the prospect of opening our first west coast office,&quot; says Eddy. &quot;We look forward to engaging the area&#39;s exceptional technical talent, working to provide solutions to the local DoD community, and overall expanding our impact across the region.&quot; ',
        'The Seattle office will support a range of MORSE Corp&#39;s capabilities to serve nearby customers in the US Department of Defense, such as the Naval Undersea Warfare Center (NUWC) Division Keyport, and other West Coast customers.',
        ].concat(prSignature)
    });

morsePRs.push({
    prId: "pr_05_02_2025",
    title: 'MORSE Corp hosts Community Cleanup Day',
    date: "May 02, 2025",
    author: "MORSE Corp",
    duration: "2 minute read",
    categories: ["news", "culture"],
    image: "images/news/pr-MORSECORP-beachcleanup-2025.png",
    summary: 'The MORSE Corp (MORSECORP Inc.) team spent a sunny Wednesday morning at Carson Beach and Moakley Park in South Boston, collecting trash as part of our annual community cleanup day.',
    content: [
        'Cambridge, MA. The MORSE Corp (MORSECORP Inc.) team spent a sunny Wednesday morning at Carson Beach and Moakley Park in South Boston, collecting trash as part of our annual community cleanup day.',
        '&quot;We are dedicated to our community and want to give back to Cambridge and Boston,&quot; says Esther Pacheco, Head of Business Operations. &quot;This is an easy way to make an immediate, visible impact, with instant gratification when you see the beach and park&apos;s transformation after we are done.&quot;',
        'To add a competitive element to the day, the MORSE teams divided into smaller groups to see which one could collect the most trash. The teams returned with hundreds of pounds of trash, adding an extra layer of engagement and fun to the day. Each quarter, MORSE hosts company-wide events that bring the organization together, with team building as a key outcome. This event was a great example of how we can come together to make a difference in our community.',
        ].concat(prSignature)
    });

morsePRs.push({
    prId: "pr_04_04_2025",
    title: 'MORSE Corp Awarded $98M STEAM IDIQ for AI Enabled Systems ',
    date: "April 04, 2025",
    author: "MORSE Corp",
    duration: "2 minute read",
    categories: ["news"],
    image: "images/news/98m-contract_PR.jpg",
    summary: 'MORSE Corp is excited to announce the award of the System-wide Test and Evaluation and applied Artificial Intelligence/Machine Learning (STEAM) Indefinite Delivery Indefinite Quantity (IDIQ).',
    content: [
        'Cambridge, MA. MORSE Corp is excited to announce the award of the System-wide Test and Evaluation and applied Artificial Intelligence/Machine Learning (STEAM) Indefinite Delivery Indefinite Quantity (IDIQ). STEAM will provide AI capabilities and expertise with testing and deploying AI Enabled Systems (AIES) in support of the U.S. Army’s efforts to leverage trusted AI at scale. STEAM has a $97,509,340 IDIQ ceiling. MORSE is proud to support Army Research Laboratory as part of STEAM. ',
        'MORSE will provide research and development (R&D) services to innovate, prototype, and deliver advanced capabilities to solve warfighter challenges related to AI. STEAM’s scope spans data analysis, advanced analysis, applied AI/ML, generative AI solutions, human-machine integration, and test and evaluation (T&E). MORSE’s innovations and contributions via task orders on STEAM are aligned to our core principles of eliminating vendor lock through delivery of platform, environment, and tool agnostic capabilities provided to the U.S. Army with unlimited rights. ',
        '“We’re excited to bring our expertise in advanced T&E, applied AI/ML, generative AI, and human-machine teaming to the U. S. Army. These capabilities along with MORSE’s focus on speed, relevance, and transparency will enable the U.S. Army to accelerate AI development and deployment to increase lethality of the U.S. Army now and in the future,” says Eric Nelson, MORSE Data Intelligence Portfolio Lead. “Our team is motivated to make an impact on fielding AI solutions for the Warfighter.” ',
        'For more information on our award, read more here: <a href="https://www.defense.gov/News/Contracts/Contract/Article/4081466//" target="_blank">https://www.defense.gov/News/Contracts/Contract/Article/4081466// </a>',
        ].concat(prSignature)
    });

morsePRs.push({
    prId: "pr_02_05_2025",
    title: 'MORSE Corp Selected as IAC MAC IDIQ Prime Contractor',
    date: "February 05, 2025",
    author: "MORSE Corp",
    duration: "1 minute read",
    categories: ["news"],
    image: "images/news/IAC-MAC-IDIQ.png",
    summary: 'MORSE Corp is excited to announce our award of the Information Analysis Center (IAC) Multiple Award Contract (MAC) as a prime contractor on Pool 2.',
    content: [
        'MORSE Corp is excited to announce our award of the Information Analysis Center (IAC) Multiple Award Contract (MAC) as a prime contractor on Pool 2. IAC MAC is an indefinite delivery/indefinite quantity (IDIQ) contract with a $48B ceiling which is open to all DoD components for a wide range of Research and Development (R&D) services. IAC MAC has been designated a best-value contract vehicle to acquire R&D and research and analysis services by the Office of the Secretary of Defense (OSD).',
        'IAC MAC now provides MORSE with a flexible contract vehicle that will facilitate continued innovation and fielding of capabilities that increase the effectiveness of the warfighter. MORSE’s current and future customers will benefit from IAC MAC, which enables scalable task orders, allows for a rapid acquisition process tailored to meet customer objectives, and has a contract access fee of less than 1%.',
        '“This is a significant win for MORSE to provide us with greater access to solve complex challenges for the DoD as the prime contractor. IAC MAC creates an avenue to combine rapid innovation with ease of contracting to maximize impact” says Brian Bryson, Lead of Strategic Initiatives at MORSE.',
        'This contract award scope covers a broad set of MORSE capabilities including AI, data analytics, software engineering, air drop, mission planning, C4ISR, modeling & simulation, test & evaluation, novel materials, and autonomous vehicles.',
        'For more information on IAC MAC, please contact: Brian Bryson, bbryson@morsecorp.com'
        ].concat(prSignature)
    });

morsePRs.push({
    prId: "pr_01_31_2025",
    title: 'Built In Honors MORSE Corp in Its 2025 Best Places to Work Awards',
    date: "January 31, 2025",
    author: "MORSE Corp",
    duration: "1 minute read",
    categories: ["culture", "news"],
    image: "images/news/builtInBoston.jpg",
    summary: 'Built In announced that MORSE Corp was honored in its 2025 Best Places to Work Awards. MORSE earned spots on the <b>100 Best Midsize Places to Work in Boston</b>, 100 Best Midsize Places to Work in Washington DC, and 100 Best Places to Work in Washington DC in 2025 lists.',
    content: [
        'Built In today announced that MORSE Corp was honored in its 2025 Best Places To Work Awards. MORSE earned spots on the 100 Best Midsize Places to Work in Boston, 100 Best Midsize Places to Work in Washington DC, and 100 Best Places to Work in Washington DC in 2025 lists.',
        '“As MORSE celebrates a decade of growth, we are thrilled to be recognized as a 2025 Best Places to Work award winner. This achievement is a testament to the exceptional talent and dedication of our team. Building on the momentum of a remarkable 2024, marked by our 10th anniversary, our new office expansion in Arlington, VA and continued growth at our Cambridge, MA headquarters, we are proud to be fostering a work environment that inspires collaboration, passion, and exceptionalism", says MORSE CEO, Andreas Kellas. ',
        'Built In’s annual Best Places to Work program honors companies with the best total rewards packages across the U.S. and in the following tech hubs: Atlanta, Austin, Boston, Chicago, Colorado, Dallas, Houston, Los Angeles, Miami, New York, San Diego, San Francisco, Seattle and Washington DC. Best Places to Work is distinct because it selects tech companies that build their offerings specifically around what tech professionals value in a workplace. ',
        '“Being recognized as a Best Place to Work is a testament to these companies’ commitment to building a workplace where individuals and innovation thrive," says Built In CEO and Founder, Maria Christopoulos Katris. “At Built In, we understand that great companies are powered by great teams, and this achievement showcases their dedication to fostering a culture of growth, inclusivity, and excellence. Congratulations on this well-deserved honor.”'
        ].concat(prSignature)
    });

morsePRs.push({
    prId: "pr_08_12_2024",
    title: 'MORSE Corp Wins $66.7 Million Contract to Modernize US Army’s Data and Software Engineering Capabilities',
    date: "August 12, 2024",
    author: "MORSE Corp",
    duration: "2 minute read",
    categories: ["news"],
    image: "images/news/66M-contract_PR.jpg",
    summary: 'MORSE Corp Wins $66.7 Million Contract to Modernize US Army’s Data and Software Engineering Capabilities',
    content: [
            'MORSE Corp is proud to announce that it has been awarded a $66,676,574 firm-fixed-price contract by the US Army to provide data and software engineering support. The contract, which is expected to be completed by May 21, 2029, will enable the Army to significantly enhance its Test & Evaluation (T&E) capabilities.',
            'Under this contract, MORSE Corp will deliver its cutting-edge Artificial Intelligence (AI), Data, and Engineering Processing Toolbox (ADEPT) solution. ADEPT enables efficient data management in hybrid on-prem, cloud-native, and classified compute environments, allowing the Army to accelerate its T&E capabilities.',
            '"ADEPT enables better decisions at the speed of relevance to field critical capabilities to the warfighter," said Eddy Scott, Battle Management Deputy Portfolio Lead.  "We look forward to supporting the Army’s modernization of its T&E tools".',
            'This contract award demonstrates MORSE Corp’s expertise in AI, data analytics, and software engineering, as well as our ability to deliver complex projects that meet the evolving needs of the US military. MORSE leveraged CDAO Tradewinds Marketplace to enable this contract. MORSE’s ADEPT tool is available to other US Department of Defense organizations in need of streamlined data management and more information can be found <a target="_blank" href=https://tradewindai.com/marketplace/clix3p9r3004eky0898a68qi3>here</a>.',
            '<a target="_blank" href=https://www.defense.gov/News/Contracts/Contract/Article/3787731>Read more</a>'
        ].concat(prSignature)
    });

morsePRs.push({
    prId: "pr_08_02_2024",
    title: 'MORSE Corp Awarded $49.95 Million US Army Contract for Advanced Technology Development',
    date: "August 2, 2024",
    author: "MORSE Corp",
    duration: "2 minute read",
    categories: ["news"],
    image: "images/news/pr-devcom-solider-center.jpg",
    summary: 'MORSE Corp Awarded $49.95 Million US Army Contract for Advanced Technology Development',
    content: [
            'MORSE Corp is excited to announce that it has been awarded a prime contract by the US Army Development Command Soldier Center (DEVCOM SC) in Natick, MA, to develop a broad set of science and technology (S&T) capabilities. The contract, which has a five-year performance period, carries a total value of $49.95 million, including options.',
            'The US Army DEVCOM SC’s focus is to support the research, development, and engineering to sustain current warfighter systems and develop future systems and is known as the Army’s center for soldier-related research and development.',
            'The work will include both hardware and software development to enable more accurate, survivable, and reliable cargo systems, as well as safer and more user-friendly personnel systems.',
            '“We are honored to extend our partnership with DEVCOM Soldier Center, marking our 10th year of collaboration with this esteemed organization,” said Andreas Kellas, CEO of MORSE Corp. “This contract underscores our commitment to delivering innovative solutions that address the dynamic needs of the warfighter. We look forward to contributing significantly to the advancement of our nation’s military capabilities.”'
        ].concat(prSignature)
    });

morsePRs.push({
    prId: "pr_03_26_2024",
    title: 'MORSE Welcomes Lieutenant General John N.T. “Jack” Shanahan, USAF (Retired) to Advisory Board',
    date: "March 26, 2024",
    author: "MORSE Corp",
    duration: "2 minute read",
    categories: ["culture","news"],
    image: "images/news/john_shanahan.png",
    summary: 'MORSE Welcomes Lieutenant General John N.T. “Jack” Shanahan, USAF (Retired) to Advisory Board',
    content: [
            'MORSE, a leading provider of artificial intelligence (AI) solutions across the DoD and Intelligence Community (IC), is excited to announce that Lieutenant General John “Jack” N.T. Shanahan (USAF, Ret.) has joined its Advisory Board. As an experienced leader with a demonstrated track record of excellence, Jack will play a pivotal role in shaping MORSE’s strategic vision of delivering practical AI-driven solutions that provide an asymmetric advantage to US warfighters in today’s rapidly evolving battlespace.',
            'Lt Gen Shanahan retired in 2020 after a distinguished 36-year career in the USAF, serving in a variety of operational and staff positions across diverse fields including flying, intelligence, policy, and command and control. Jack commanded at the squadron, group, wing, Agency, and Numbered Air Force levels. As the inaugural Director of the Algorithmic Warfare Cross-Functional Team, also known as Project Maven, he established and led the DoD’s pathfinder AI fielding program charged with bringing AI capabilities to intelligence collection and analysis. In his final assignment, Jack served as the first Director of the DoD Joint Artificial Intelligence Center (JAIC). After retiring, he completed the Master of International Studies program at North Carolina State University.',
            'During a recent discussion about the adoption of AI across the DoD, Lt. Gen. Shanahan stated, “We are at the birth of it. We’re not far removed from the equivalent of the Wright Brothers taking flight at Kitty Hawk.” He continued, “With Project Maven and the JAIC, I was for all intents and purposes, the CEO of two AI startups in the Pentagon.” Reflecting on the positive developments since Project Maven, Jack continued, “That was a steep learning curve. Nobody in the Defense Department should ever have to start an AI project from scratch again like we did in those early days.” Regarding his new role on the MORSE Advisory Board Lt. Gen. Shanahan offered, “I am extremely selective in the companies I choose to work with. MORSE prioritizes relationship building with a focus of working exclusively with the government on high impact, needle-moving programs that meet urgent operational needs. There are very few companies I’ve encountered where those are the first things the CEO talks about.”',
            'Jack remains a leading voice for AI in national security, helping to usher in an era of ‘software-defined warfare’ while emphasizing the importance of Responsible AI (RAI) to ensure the safe, lawful, and ethical use of AI across the national security community. “MORSE’s top priority is transition to the US warfighters we serve, and therefore, it is vitally important that we have representation for these men and women on our advisory board,” says MORSE CEO, Andreas Kellas. “I cannot imagine a more qualified individual to provide this representation than Jack Shanahan. I’m honored that Jack has joined MORSE and look forward to working with him as we continue to push the boundaries and discover the art of the possible for AI integration and adoption across the DoD.”',
        ].concat(prSignature)
    });

morsePRs.push({
    prId: "pr_03_05_2024",
    title: "MORSE Opens Washington, DC/Arlington, VA Office",
    date: "March 5, 2024",
    author: "MORSE Corp",
    duration: "2 minute read",
    categories: ["culture","news"],
    image: "images/news/arlington-office-press-release.jpg",
    summary: 'MORSE Opens Washington, DC/Arlington, VA Office',
    content: [
            'MORSE Corp is excited to announce the opening of a new office in Arlington, VA. This strategic expansion establishes the company’s first permanent physical presence outside of our Cambridge, MA headquarters and allows us to better serve our customers located in the Washington, D.C./Northern VA area. This also provides MORSE the exciting opportunity to recruit talent in the region with an office to fuel on-site interactions essential to our core focus on innovation.',
            '“This is an exciting milestone for MORSE" said CEO, Andreas Kellas. "MORSE has steadily grown over the past 9 years and slowly expanded our footprint each year in the Cambridge/Boston area. While we serve DoD and National Security customers throughout the United States, the Washington, D.C. metro area is a strategic hub for many of our sponsors and travel and time spent in this area has been steadily increasing. At our core, MORSE is a customer and user-centric organization and the more time we can spend face-to-face, in-person with our customers, the better we can fulfill our mission.”',
            'Located at 4040 Wilson Boulevard, this recently constructed building boasts an unparalleled setting in the heart of Ballston. Our team will enjoy the convenience of being within walking distance to public transportation, on-site parking, and a variety of exceptional dining options. The property features a stunning rooftop terrace, state-of-the-art fitness center, and other premium amenities that ensure a comfortable and productive work environment for our employees.'
        ].concat(prSignature)
    });

morsePRs.push({
    prId: "pr_01_12_2024",
    title: "Built In Honors MORSE as One of Boston’s Best Places to Work",
    date: "January 12, 2024",
    author: "MORSE Corp",
    duration: "1 minute read",
    categories: ["culture","news"],
    image: "images/news/build-in-boston-2024.jpg",
    summary: 'Built In today announced that MORSE Corp was honored...',
    content: [
            'Built In today announced that MORSE Corp was honored in its 2024 Best Places To Work Awards. Specifically, MORSE earned a place on Best Places to Work in Boston, MA. The annual awards program includes companies of all sizes, from startups to those in the enterprise companies in large tech markets across the U.S.',
            'MORSE was established in 2014 to bring cutting-edge technology and innovative solutions to the U.S. Department of Defense and Intelligence Community. “This year, as we celebrate our 10th anniversary, we extend heartfelt gratitude to our exceptional team for their unwavering dedication and commitment to excellence. Our people are the driving force behind our success, and it’s their ingenuity, creativity, and passion that enable us to tackle complex challenges and create meaningful impact” said Andreas Kellas, CEO of MORSE Corp.',
            'MORSE stands out as an employee-owned organization. All full-time staff are shareholders and there are no non-employee shareholders. This year, MORSE will expand its headquarters in Cambridge, MA and is excited to announce the opening of a Washington, DC office.',
            '“I’d like to extend our heartfelt congratulations to the 2024 Best Places to Work winners,” says Maria Christopoulos Katris. “I am truly inspired by these companies that have risen to the challenge of fostering a positive work environment, maintaining a strong brand, and ensuring employee satisfaction. The future is filled with promise and we are so excited to see what lies ahead.”',
            '<b>About Built In</b>',
            'Built In is creating the largest candidate generation platform for technology professionals globally. Monthly, millions of the industry’s most in-demand professionals visit the site from across the world. They rely on our platform to stay ahead of tech trends and news, learn skills to accelerate their careers and find opportunities at companies whose values they share. Built In also serves thousands of innovative companies from startups to the Fortune 500. By putting their stories in front of our uniquely engaged audience, we help them reach otherwise hard-to-hire tech professionals. <a target="_blank" href=https://employers.builtin.com/best-places-to-work/" target="_blank">www.builtin.com</a>.',
            '<b>About Built In’s Best Places To Work</b>',
            'Built In’s annual Best Places to Work program honors companies with the best total rewards packages across the U.S. and in the following tech hubs: Atlanta, Austin, Boston, Chicago, Colorado, Dallas, Houston, Los Angeles, Miami, New York, San Diego, San Francisco, Seattle and Washington DC. Best Places to Work is distinct because its algorithm selects tech companies that build their offerings specifically around what tech professionals value in a workplace. <a target="_blank" href=https://employers.builtin.com/best-places-to-work/" target="_blank">Winners are announced in early January 2024</a>.',
        ].concat(prSignature)
    });

morsePRs.push({
    prId: "pr_08_29_2022",
    title: "MORSE Corp Awarded $44M Contract for Advanced Test & Evaluation of Artificial Intelligence and Machine Learning Algorithms",
    date: "August 29, 2022",
    author: "MORSE Corp",
    duration: "1 minute read",
    categories: ["news"],
    image: "images/news/advanced-te-ai-press-release.jpg",
    summary: 'MORSECORP Inc., Cambridge, Massachusetts, was awarded a $44,890,537 firm-fixed-price contract for advanced test and evaluation of artificial intelligence and machine learning algorithms.',
    content: [
            'MORSECORP Inc., Cambridge, Massachusetts, was awarded a $44,890,537 firm-fixed-price contract for advanced test and evaluation of artificial intelligence and machine learning algorithms. Bids were solicited via the internet with 999 received. Work will be performed in Cambridge, Massachusetts, with an estimated completion date of Aug. 31, 2025. Fiscal 2022 research, development, test, and evaluation, Army funds in the amount of $3,195,693 were obligated at the time of the award. U.S. Army Contracting Command, Aberdeen Proving Ground, Maryland, is the contracting activity (W911QX-22-C-0029).',
            'Read more <a target="_blank" href=https://www.defense.gov/News/Contracts/Contract/Article/3141819/" target="_blank">here</a>.'
        ].concat(prSignature)
    });

morsePRs.push({
    prId: "pr_06_06_2022",
    title: "U.S. Army and MORSE Complete Major Upgrade of Airdrop System",
    date: "June 6, 2022",
    author: "MORSE Corp",
    duration: "2.5 minute read",
    categories: ["news"],
    image: "images/news/pr-jpads-1200x627.jpg",
    summary: 'MORSE Corp worked with the U.S. Army to complete a major capability upgrade to a precision airdrop system that delivers supplies like food, water, and ammunition to deployed troops, while also making it easier to use.',
    content: [
            'MORSE Corp worked with the U.S. Army to complete a major capability upgrade to a precision airdrop system that delivers supplies like food, water, and ammunition to deployed troops, while also making it easier to use.' ,
        
            'Other improvements that were part of the Joint Precision Airdrop System (JPADS) 2K Block Upgrade effort enable vendor collaboration on the program, making development work more efficient and giving more opportunities to test the hardware prior to operations.',

            'JPADS 2K is fully autonomous and capable of delivering 2,000 pounds of supplies. The system includes a parachute and a guidance unit, which autonomously steers cargo to a desired target. Along with the JPADS 10K variant, it’s the military’s only cargo delivery system that enables highly accurate drops, along with soft landings, from distances far enough and altitudes high enough to avoid antiaircraft fire.',

            '“We took a holistic look at the system, from the mission planning software literally down to the screws on the hardware, as we sought to take JPADS from being a system that warfighters were required to work with, to one that they would want to use,” said Eddy Scott, MORSE’s chief engineer for the JPADS 2K effort.',

            'Improvements that make JPADS 2K easier to use include: <ul style="list-style-type:disc"><li>A streamlined user interface on the mission planning tool that makes it easy for users with minimal training to plan airdrop missions.</li><li>A new user interface on the guidance system, enabling prep teams to determine with a single glance whether the payloads have been programmed correctly, rather than by inputting a series of commands.</li><li>Adding a front-facing camera to the JPADS guidance system, enabling mission planning officials to hand a QR code to the team preparing the payloads, rather than a hard copy of the plan to input manually, which is time-consuming and risks errors during data entry.</li></ul>',

            'The user interface includes a large color screen with keypad that has been specifically optimized for JPADS user inputs. Some military users have reported that the new screen is so simple and intuitive that they did not have to read their technical manual for instructions.',

            'Other upgrades included the addition of a military-grade radio that allows JPADS payloads to share information like wind data with each other while in the air, making their flight more accurate and safe. During drops that involve both cargo and personnel, troops can use the radio to monitor the location of other assets, deconflict flight paths, set multiple landing destinations, and make necessary changes while in flight.',

            'MORSE also helped the Army transition from a waterfall software development approach to a government-run software factory approach, with the customer handling system integration. Multiple JPADS contractors now collaborate in a virtual environment where they can view each other’s software, including changes and documentation. This has helped to identify potential integration problems earlier in the development process, Scott said. While the JPADS team had previously conducted several tests each year, the collaborative development now runs so efficiently that testing can occur at least monthly, he said. And the collaborative environment makes it easier for the government to try incorporating items from new vendors and understand whether they’ll fit into the program, he said.',

            'Traditionally, airdrop testing is conducted at intervals with several months in between, due to the cost of preparation for and execution of a live airdrop test event. The JPADS Block Upgrade team used the software factory approach to enable automated continuous integration software testing, automated log file analysis, and extensive lab hardware-in-the-loop testing, which allowed them to test as often and inexpensively as possible.',

            'Changing the way testing is conducted enables hundreds of flights to be completed over a three-year period, providing near real-time feedback to the development team on newly-added capabilities, which would not be possible with legacy processes.',
        
        ].concat(prSignature)
});

morsePRs.push({
    prId: "pr_03_15_2022",
    title: "JAIC Chooses MORSE for Data Readiness for Artificial Intelligence Development (DRAID) BOA Worth Up to $241 Million",
    date: "March 15, 2022",
    author: "MORSE Corp",
    duration: "2 minute read",
    categories: ["news"],
    image: "images/news/CDAO-press-release.jpg",
    summary: 'The Pentagon’s Joint Artificial Intelligence Center (JAIC) has selected MORSE Corp to help build data preparation systems and accelerate the development of AI as part of a contract worth up to $241 million over the next five years.',
    content: [
            'The Pentagon’s Joint Artificial Intelligence Center (JAIC) has selected MORSE Corp to help build data preparation systems and accelerate the development of AI as part of a contract worth up to $241 million over the next five years.',

            'The Data Readiness for AI Development (<a target="_blank" href="https://www.ai.mil/blog_04_01_21_enabling_ai_data_readiness_in_the_dod.html">DRAID</a>) Acquisition Vehicle will “leverage the power of the American enterprise to create the troves of AI ready data that will power the transformation of the [Department of Defense] through AI,” the JAIC notes in an article posted on its website.',

            'The DRAID initiative addresses the management of data throughout the AI development lifecycle, including data ingestion, labeling, training, test and evaluation, and deployment. All DRAID contract orders will require the contractors to demonstrate how their products and solutions address the <a target="_blank" href="https://www.ai.mil/docs/Ethical_Principles_for_Artificial_Intelligence.pdf">DoD AI Ethical Principles</a> and handle potential ethical risks throughout the AI product lifecycle. DRAID will also include tasks to address identifying bias in data, mechanisms for data management and data governance, and other ways to support ethical AI system development.',

            '“AI systems are beginning to transform our approach to national security, but they cannot meet their potential without quality data and agile data systems that enable organizations to rapidly develop AI,” said Christian Borden, MORSE’s chief engineer for JAIC programs. “We look forward to helping the JAIC and Department of Defense users develop and deploy purpose-built systems that manage their data in an ethical, automated, and impactful manner so their solutions accelerate the implementation of AI and can be scaled to have a department-wide impact.”',

            'MORSE has built cloud-native tools for AI data preparation purposes for multiple DoD organizations. These tools address functions including AI-assisted labeling of data; augmentation of data to account for variables and conditions that aren’t part of the set; automatic identification of low-quality data that should be removed from the set; and automatic optimal splitting data for training, validation, and testing across multiple classes.',

            'The JAIC also recently selected MORSE Corp to take part in its <a target="_blank" href="https://www.morsecorp.com/news18.html">Test &amp; Evaluation Blanket Purchase Agreement</a>, an initiative with a potential budget of $250 million intended to help develop new and innovative AI testing tools, capabilities, and services that equip the military to rapidly test and validate emerging AI offerings.'
        ].concat(prSignature)
});

morsePRs.push({
    prId: "pr_03_08_2022",
    title: "Built In Honors MORSE as one of Boston’s Best Places to Work",
    date: "MARCH 08, 2022",
    author: "MORSE Corp",
    duration: "2 minute read",
    categories: ["culture", "news"],
    image: "images/news/opt1-blue-logo.png",
    summary: 'Built In, an online community for startups and tech companies, has honored MORSE Corp with one of its 2022 Best Places to Work Awards. The award ranks MORSE as a <a target="_blank" href="https://www.builtinboston.com/companies/best-midsize-places-to-work-boston-2022">top midsized</a> company in the Boston area.',
    content: [
                'Built In, an online community for startups and tech companies, has honored MORSE Corp with one of its 2022 Best Places to Work Awards. The award ranks MORSE as a <a target="_blank" href="https://www.builtinboston.com/companies/best-midsize-places-to-work-boston-2022">top midsized</a> company in the Boston area.',

                'This is MORSE’s first time winning the award, which Built In launched in 2019. Built In determines winners based on company data about compensation; benefits; remote and flexible work opportunities; programs for diversity, equity, and inclusion; and other factors.',

                '“Our people are our number one asset and the primary factor in MORSE’s success,” said Andreas Kellas, MORSE Corp CEO. “If we want them to be innovative as they develop technology to help our national security customers accomplish their missions, we need to make sure that they’re happy, fulfilled, and in a great work environment.”',

                'MORSE has grown organically to over 150 employees based in our Cambridge headquarters over the past seven years. The company offers benefits and perks including open leave, 401(k) matching, a priority on work/life balance, a hybrid work environment, parental leave, a kitchen stocked with drinks and snacks, quarterly team building events, happy hours and game nights, and more. Uniquely, MORSE is 100% employee-owned, meaning all full-time employees are given shares in the company upon joining, and there are no outside investors. MORSE also engages in corporate volunteerism including a recent company-wide effort to <a target="_blank" href="https://www.morsecorp.com/news17.html">clean up more than 1000 pounds</a> of trash in Cambridge and supporting Homes for Our Troops, a charitable organization that builds homes for injured veterans.',

                '“It is my honor to extend congratulations to the 2022 Best Places to Work winners,” said Sheridan Orr, Built In’s chief marketing officer. “This year saw a record number of entrants — and the past two years fundamentally changed what tech professionals want from work. These honorees have risen to the challenge, evolving to deliver employee experiences that provide the meaning and purpose today’s tech professionals seek.”'
            ].concat(prSignature)
});

morsePRs.push({
    prId: "pr_02_10_2022",
    title: "JAIC Selects MORSE for AI Test and Evaluation Effort With $250 Million Ceiling",
    date: "FEBRUARY 10, 2022",
    author: "MORSE Corp",
    duration: "2 minute read",
    categories: ["news"],
    image: "images/news/CDAO-press-release.jpg",
    summary: 'The Pentagon’s Joint Artificial Intelligence Center (<a target="_blank" href="https://www.ai.mil/">JAIC</a>) has selected MORSE Corp to take part in an initiative intended to help the JAIC develop new and innovative AI testing tools, capabilities, and services that can equip the military to rapidly test and validate emerging AI offerings',
    content: [
                'The Pentagon’s Joint Artificial Intelligence Center (<a target="_blank" href="https://www.ai.mil/">JAIC</a>) has selected MORSE Corp to take part in an initiative intended to help the JAIC develop new and innovative AI testing tools, capabilities, and services that can equip the military to rapidly test and validate emerging AI offerings.',

                'The JAIC Test &amp; Evaluation (T&amp;E) Blanket Purchase Agreement (BPA) has a $250 million ceiling over the next five years.',

                'Under the agreement, MORSE will help the JAIC develop software services to test and evaluate AI capabilities, execute testing and evaluation for a broad spectrum of AI domains, and integrate software services into infrastructure like the JAIC’s Joint Common Foundation, a cloud-based AI development and experimentation environment.',

                '“Without T&amp;E, we cannot accurately determine the value AI solutions provide,” said Andreas Kellas, MORSE CEO. “This BPA is a testament to the vision of the JAIC and directly supports the core mission of the center – to accelerate the adoption and integration of AI across the Department of Defense. We look forward to working with the JAIC to provide solutions that can be shared across the DoD, while providing full transparency into how our T&amp;E is executed.”',

                'MORSE’s work under the BPA will build on the company’s legacy of rigorous independent T&amp;E that we perform as a service for our customers so they can assess technology that they are procuring from other contractors.',

                'MORSE applies AI and machine learning solutions for applications including imagery analysis, tracking targets in full-motion video, reasoning for anomaly detection, undersea sensing, predictive maintenance, and vehicle navigation.',

                '“We’re addressing challenges spanning the entire AI life-cycle in areas including data labeling, optimizing the human-machine workflow, model training, T&amp;E, and AI deployment,” said Christian Borden, MORSE’s chief engineer for JAIC T&amp;E. “We look forward to continuing to support the JAIC under this BPA by providing rapid and rigorous T&amp;E with a DevSecOps approach as we develop scalable, cloud-native solutions for Defense Department users.”'
            ].concat(prSignature)
});

morsePRs.push({
    prId: "pr_12_02_2021",
    title: "Keep Massachusetts Beautiful Honors MORSE as its Business Partner of the Year",
    date: "DECEMBER 2, 2021",
    author: "MORSE Corp",
    duration: "2 minute read",
    categories: ["culture", "news"],
    image: "images/news/keepMAbeautiful_morse.png",
    summary: 'Keep Massachusetts Beautiful, a nonprofit organization focused on getting people involved with improving their communities through cleanups and beautification projects, honored MORSE Corp as its Business Partner of the Year during a Dec. 2 ceremony.',
    content: [
                'Keep Massachusetts Beautiful, a nonprofit organization focused on getting people involved with improving their communities through cleanups and beautification projects, honored MORSE Corp as its Business Partner of the Year during a Dec. 2 ceremony.',

                'MORSE employees cleared 1,163 Pounds of trash in Cambridge on Oct. 14 as part of its collaboration with <a target="_blank" href="https://keepmassbeautiful.org/who-we-are/">Keep Massachusetts Beautiful</a>, which began in 2019.',

                'One hundred and twenty MORSE employees took part in the cleanup effort in East Cambridge and along Memorial Drive. MORSE coordinated with the city government to remove items that did not fit into trash bags, including discarded furniture and construction materials.',

                '“The ‘M’ in MORSE stands for ‘mission.’ While our work is focused on supporting the mission of our armed forces, we also want to support the local community where we work,” said Andreas Kellas, MORSE Corp CEO. “It was a surprise and an honor to receive this award, and it’s been a tremendous pleasure to work with Keep Massachusetts Beautiful to give back to the community.”',

                'MORSE previously collaborated with Keep Massachusetts Beautiful to clean up South Boston’s Carson Beach in July 2019 and 2020.',

                '“MORSE employees have been some of our most active and enthusiastic corporate volunteers over the past three years,” said Neil Rhein, founder and executive director of Keep Massachusetts Beautiful. “They set a great example that I hope others will follow and are making a real difference when it comes to cleaning up the vast of amounts of litter in the Greater Boston area.”',

                'Other recent MORSE efforts in the local community include working with Habitat for Humanity in September to help build a house in Mission Hill. The company also works closely with Homes for Our Troops, sending a 26-member team to a 5K race benefiting the organization on Nov. 14 and contributing $20,000 last year to help build an accessible home for a wounded veteran in Derry, N.H.'
            ].concat(prSignature)
});

morsePRs.push({
    prId: "pr_10_15_2021",
    title: "Boston Business Journal Honors MORSE CEO Andreas Kellas with 40 Under 40 Award",
    date: "OCTOBER 15, 2021",
    author: "MORSE Corp",
    duration: "1 minute read",
    categories: ["culture", "news"],
    image: "images/news/akellas-acbj.png",
    summary: 'We’re proud to have Andreas Kellas, our founder and CEO, honored with the Boston Business Journal’s 40 Under 40 award, which recognizes the city’s “<a href="https://www.bizjournals.com/boston/news/2021/08/31/bbj-announces-this-year-s-40-under-40.html" target="_blank">best and brightest young professionals.</a>”',
    content: [
                'We’re proud to have Andreas Kellas, our founder and CEO, honored with the Boston Business Journal’s 40 Under 40 award, which recognizes the city’s “<a href="https://www.bizjournals.com/boston/news/2021/08/31/bbj-announces-this-year-s-40-under-40.html" target="_blank">best and brightest young professionals.</a>',

                'The Boston Business Journal editorial staff selected the honorees from more than 200 nominations.',

                '"This year&quot;s 40 Under 40 honorees have been through a lot, and like all of us have overcome much, to be where they are today," said Carolyn M. Jones, Boston Business Journal market president and publisher. "Their dedication and innovation inspire us all."',

                'Read more to hear Andreas’ thoughts about how a childhood hobby led to his start as an entrepreneur, the value of exceptional teammates, what drives him, and more.',

                '<a href="docs/ACBJ-AKellas.pdf" target="_blank" >Read more</a>'
            ]
});

morsePRs.push({
    prId: "pr_08_05_2021",
    title: "$10.9M AI contract modification awarded",
    date: "AUGUST 5, 2021",
    author: "MORSE Corp",
    duration: "1 minute read",
    categories: ["news"],
    image: "images/news/acc_logo.jpg",
    summary: 'MORSE was awarded a $10.9M modification by the Army to develop novel artificial intelligence/machine learning test, evaluation and algorithmic ensembling capabilities.',
    content: [
                'MORSE was awarded a $10.9M modification by the Army to develop novel artificial intelligence/machine learning test, evaluation and algorithmic ensembling capabilities.',

                '<a href="https://www.defense.gov/Newsroom/Contracts/Contract/Article/2721522/" target="_blank">Read more</a>'
            ].concat(prSignature)
});

morsePRs.push({
    prId: "pr_05_15_2021",
    title: "MORSE continues partnership with Homes For Our Troops",
    date: "MAY 15, 2021",
    author: "MORSE Corp",
    duration: "1 minute read",
    categories: ["culture", "news"],
    image: "images/news/home_for_our_troops_ceremony.png",
    summary: 'MORSE participated in the Homes For Our Troops kick-off ceremony for the construction of a specially adapted home for injured Army SGT Brandon Korona in Derry, NH.',
    content: [
                'On Saturday May 15th, MORSE participated in the Homes For Our Troops kick-off ceremony for the construction of a specially adapted home for injured Army SGT Brandon Korona in Derry, NH. You can learn more about Brandon and his project <a href="https://www.hfotusa.org/building-homes/veterans/korona/" target="_blank">here</a>',

                'MORSE is a proud sponsor of Homes for Our Troops. You can read more about our contribution <a href="https://www.morsecorp.com/news10.html" target="_blank">here</a>.'
            ].concat(prSignature)
});

morsePRs.push({
    prId: "pr_12_21_2020",
    title: "$10.9M AI contract modification awarded",
    date: "DECEMBER 21, 2020",
    author: "MORSE Corp",
    duration: "1 minute read",
    categories: ["news"],
    image: "images/news/acc_logo.jpg",
    summary: 'MORSE was awarded a $10.9M modification by the Army to develop novel artificial intelligence/machine learning test, evaluation and algorithmic ensembling capabilities.',
    content: [
                'MORSE was awarded a $10.9M modification by the Army to develop novel artificial intelligence/machine learning test, evaluation and algorithmic ensembling capabilities.'
            ].concat(prSignature)
});

morsePRs.push({
    prId: "pr_11_10_2020",
    title: "MORSE to Open Source Snappiershot Testing Library",
    date: "NOVEMBER 10, 2020",
    author: "MORSE Corp",
    duration: "2 minute read",
    categories: ["news"],
    image: "images/news/github_logo.png",
    summary: 'MORSE launched its first Free and Open Source Software (FOSS) project with the initial release of Snappiershot, a Python snapshot testing library.',
    content: [
                'MORSE launched its first Free and Open Source Software (FOSS) project with the initial release of <a href="https://github.com/MORSECorp/snappiershot" target="_blank">Snappiershot</a>, a Python snapshot testing library. MORSE has always worked hard to develop lean and nimble software, which empowers us to deliver the most flexible and highest quality software possible to our customers, while still keeping costs to a minimum. FOSS products are an integral part of that strategy. MORSE would probably not exist without the incredible array of spectacularly powerful and reliable tools developed by the FOSS community, and we are excited to have the opportunity to give back to the community that has given so much to us.',

                'At MORSE, we pride ourselves on how thoroughly we test our software. Every project, no matter how small, comes with an extensive suite of automated tests that give us and our customers confidence in the reliability of our code. Many of our applications deal with complex scientific and engineering domains in aerospace or machine learning, where automatically validating test results can be challenging because of the complexity of the expected outputs. Snapshot testing helps fill that gap in our test coverage, by allowing us to save expected results to file and to assert against them at a later date. Snapshots are a small but critical part of our larger testing infrastructure, and act as a canary in the coal mine for inadvertent changes to our applications&quot; outputs.',

                'When we first adopted snapshot testing, we began using an existing Python library called <a href="https://github.com/syrusakbary/snapshottest" target="_blank">Snapshottest</a>. However, we quickly found that it was missing several features critical to our testing needs and a lack of active maintainers made contributing to the source library impossible. So we started work on Snappiershot, our attempt to improve Snapshottest with a more robust architecture, more thorough testing, and a more extensive feature set. Among other features, we have added the following:',

                "<ul> \
                    <li>Ability to assert that an actual test result and an expected test result are almost equal, rather than exactly equal, which is essential for many of our cross-platform applications where insignificant floating point errors regularly occur.</li> \
                    <li>Support for a broader set of types. Snappier even accepts Numpy types, which substantially increases the utility of snapshot tests for scientific computing. </li> \
                    <li>Extended the supported snapshot file formats, enabling more flexible and human readable serialization of test results. The improved serialization makes it easier for developers to manually verify the contents of their test results and to review any differences when merging their updated code.</li> \
                </ul>",

                'Although our primary goal with this release is to give back to the public at large, we are also excited to invite outside contributions to the project. We are passionate about building the best tools that we can, and we know that the feedback and contributions of the many talented developers participating in FOSS projects will help us do so. You can <a href="https://github.com/MORSECorp/snappiershot" target="_blank">check out the code for Snappiershot</a>, and can follow our <a href="https://github.com/MORSECorp" target="_blank">GitHub account</a> for further updates as the project continues.'

            ].concat(prSignature)
});

morsePRs.push({
    prId: "pr_09_20_2020",
    title: "MORSE pledges $20,000 to Homes For Our Troops",
    date: "SEPTEMBER 20, 2020",
    author: "MORSE Corp",
    duration: "1 minute read",
    categories: ["culture", "news"],
    image: "images/news/hfot_logo.jpg",
    summary: 'MORSE Corp is pleased to announce that it has partnered with Homes For Our Troops, a nonprofit organization that builds and donates specially adapted custom homes nationwide for severely injured post-9/11 Veterans.',
    content: [
                'MORSE Corp is pleased to announce that it has partnered with Homes For Our Troops, a nonprofit organization that builds and donates specially adapted custom homes nationwide for severely injured post-9/11 Veterans. MORSE has earmarked our contribution towards a house being built in Derry, NH for US Army SGT Brandon Korona, who lost his left leg in an IED explosion in Afghanistan. You can learn more about Brandon and his project here. To date, the land for this project has been acquired, and Brandon’s home will be built next Spring.'
            ].concat(prSignature)
});

morsePRs.push({
    prId: "pr_08_14_2020",
    title: "US Army Awards MORSE a $14M Technology Development Contract",
    date: "AUGUST 14, 2020",
    author: "MORSE Corp",
    duration: "1 minute read",
    categories: ["news"],
    image: "images/news/ccdc_logo.png",
    summary: 'MORSE Corp is excited to announce today that it has been awarded a prime contract for a broad set of science and technology (S&T) development activities by the US Combat Capabilities Development Command (CCDC) Soldier Center.',
    content: [
                'MORSE Corp is excited to announce today that it has been awarded a prime contract for a broad set of science and technology (S&amp;T) development activities by the US Combat Capabilities Development Command (CCDC) Soldier Center. The contract has a 5-year period of performance, with options totaling $14 Million.',

                'CCDC Soldier Center is the national and international leader in warfighter science and technology development, and MORSE Corp is honored to have the opportunity for a continued partnership with this organization to advance the state of the art in multiple exciting application spaces.',

                '<a href="https://www.army.mil/natick" target="_blank">Read more about CCDC. <i class="fa fa-long-arrow-right " aria-hidden="true "></i> </a>'
            ].concat(prSignature)
});

morsePRs.push({
    prId: "pr_05_20_2018",
    title: "US Marine Corps Officially Adopts Airdrop.mil",
    date: "JUNE 20, 2018",
    author: "MORSE Corp",
    duration: "1 minute read",
    categories: ["news"],
    image: "images/news/marines.png",
    summary: 'MORSE Corp is excited to announce that the United States Marine Corps (USMC) has officially approved Airdrop.mil (also known as the JPADS Website) for training and operational airdrop mission planning. Airdrop.mil now offers the USMC a web-based, CAC-enabled tool to execute the mission-critical planning phase of an airdrop.',
    content: [
                'With funding and leadership provided by the US Army&quot;s PM Force Sustainment Systems (PM FSS) and the Combat Capabilities Development Command, Soldier Center (CCDC SC), MORSE Corp has served as the primary developer for Aidrop.mil for over three years. During that time, MORSE has designed and implemented numerous new and improved features for rapidly producing airdrop mission plans, dropzone terrain analyses, and airdrop damage estimates. Most recently, MORSE developed a new React front end with integrated ArcGIS maps to improve the user-interface responsiveness and usability. Work is ongoing to complete the transition to a streamlined, single page web-application backed by a flexible microservices architecture designed to fulfill a growing need for high-performance, distributed computation. These improvements will enable MORSE to continue delivering state-of-the-art mission planning algorithms via an intuitive, responsive, and powerful application that enhances our nation&quot;s aerial resupply capabilities.'
            ].concat(prSignature)
});

morsePRs.push({
    prId: "pr_05_31_2018",
    title: "MORSE Corp Awarded GSA Contract",
    date: "MAY 31, 2018",
    author: "MORSE Corp",
    duration: "1 minute read",
    categories: ["news"],
    image: "images/news/gsa_contract_holder.jpg",
    summary: 'MORSE Corp announced today that it has been awarded a Professional Services Schedule 00CORP contract by the General Services Administration (GSA). The GSA is the premier procurement arm for all federal government agencies.',
    content: [
                "MORSE Corp announced today that it has been awarded a Professional Services Schedule 00CORP contract by the General Services Administration (GSA). The GSA is the premier procurement arm for all federal government agencies. Under the new contract, federal, state, and local government agencies will be able to access MORSE Corp’s technology development services via GSA Advantage!®, the government’s electronic online ordering system, at www.gsaadvantage.gov.",

                'Through GSA contract number 47QRAA18D00A1, MORSE Corp will offer its capabilities to government agencies via labor category pricing that has been pre-negotiated for the next 5 years. “I am very excited about the GSA schedule contract award and the opportunities it will provide MORSE and our customers,” says Josh Torgerson, Chief Project Manager at MORSE Corp. “This contract will provide MORSE the contracting agility and speed to match our record of agile and rapid project execution. Since the GSA contract is direct with the government, it eliminates pass through fees and has limited restrictions on scope of work and color of money, maximizing our efficiency and targeting it specifically to our customer needs.”'
            ].concat(prSignature)
});

morsePRs.push({
    prId: "pr_05_07_2018",
    title: "MORSE and Revision Partner on US Navy Development",
    date: "MAY 7, 2018",
    author: "MORSE Corp",
    duration: "1 minute read",
    categories: ["news"],
    image: "images/news/revision.png",
    summary: 'MORSE is pleased to announce a new partnership with Revision Military. Under contract H92222-18-C-0007 with the US Special Operations Command, Revision and MORSE are tasked with the development of an Advanced Technology Demonstration Coxswain Helmet for the Office of Naval Research.',
    content: [
                "MORSE is pleased to announce a new partnership with Revision Military. Under contract H92222-18-C-0007 with the US Special Operations Command, Revision and MORSE are tasked with the development of an Advanced Technology Demonstration Coxswain Helmet for the Office of Naval Research. MORSE will bring to bear its algorithmic and mobile computing capabilities to enhance the situational awareness and reduce the cognitive burden imposed on the warfighter."
            ].concat(prSignature)
});

morsePRs.push({
    prId: "pr_11_15_2017",
    title: "MORSE Awarded Role on Team Tapestry for USAF Mission Planning Development",
    date: "November 15, 2017",
    author: "MORSE Corp",
    duration: "1 minute read",
    categories: ["news"],
    image: "images/news/tapestry.jpg",
    summary: 'The US Air Force has selected Tapestry Solutions, Inc (a Boeing Company) as prime contractor, along with teammates MORSE Corp and Jacobs Engineering, to provide software development for Consolidated Airdrop Tool (CAT) versions 6.x through 8.x. ',
    content: [
                "The US Air Force has selected Tapestry Solutions, Inc (a Boeing Company) as prime contractor, along with teammates MORSE Corp and Jacobs Engineering, to provide software development for Consolidated Airdrop Tool (CAT) versions 6.x through 8.x. The work will be performed under a Mission Planning Enterprise Contract II (MPEC II) delivery order, which is valued at $26 million over a four-year period.",

                '<a href="https://www.prnewswire.com/news-releases/us-air-force-awards-tapestry-solutions-26-million-to-develop-advanced-airdrop-mission-planning-software-for-military-transport-aircraft-300556274.html" target="_blank">Read more. <i class="fa fa-long-arrow-right " aria-hidden="true "></i> </a>'
            ].concat(prSignature)
});

morsePRs.push({
    prId: "pr_04_19_2017",
    title: "US Army awards MORSE Corp a $9.7M Technology Development Contract",
    date: "April 19, 2017",
    author: "MORSE Corp",
    duration: "1 minute read",
    categories: ["news"],
    image: "images/news/nsrdec_logo.png",
    summary: 'MORSE Corp is excited to announce that today the US Army Natick Soldier Research Development and Engineering Center (NSRDEC) awarded MORSE Corp a prime contract for various science and technology (S&T) development activities.',
    content: [
                "MORSE Corp is excited to announce that today the US Army Natick Soldier Research Development and Engineering Center (NSRDEC) awarded MORSE Corp a prime contract for a broad set of science and technology (S&T) development activities. The contract has a 5 year period of performance, with options totalling $9.7 Million.",
                "NSRDEC is the national and international leader in warfighter science and technology development, and MORSE Corp is honored to have the opportunity to work with such an organization to advance the state of the art in multiple exciting application spaces.",

                '<a href="https://www.army.mil/natick" target="_blank">Read more about NSRDEC. <i class="fa fa-long-arrow-right " aria-hidden="true "></i> </a>'
            ].concat(prSignature)
});

morsePRs.push({
    prId: "pr_04_29_2016",
    title: "Undersea Autonomy Kick Off",
    date: "April 29, 2016",
    author: "MORSE Corp",
    duration: "1 minute read",
    categories: ["news"],
    image: "images/news/r600.jpg",
    summary: 'MORSE Corp attended the formal kick off meeting to start its 2016 undersea autonomy development effort.',
    content: ['MORSE Corp attended the formal kick off meeting to start its 2016 undersea autonomy development effort. The goal of this effort is the improvement of modularity of future undersea vehicles. This is a significant development, as integrating new technologies to existing legacy systems has been historically cost-prohibitive due to testing and interoperability complexity. '
            ].concat(prSignature)
});

morsePRs.push({
    prId: "pr_03_18_2016",
    title: "Avalanche Prediction User Evaluation",
    date: "March 18, 2016",
    author: "MORSE Corp",
    duration: "1 minute read",
    categories: ["news"],
    image: "images/news/mtwash.jpg",
    summary: 'MORSE Corp led a two-day user evaluation on Mt. Washington&apos;s Huntington Ravine.',
    content: ["MORSE Corp led a successful two-day user evaluation on Mt. Washington's Huntington Ravine. Attendees included DoD user representatives, the American Avlalanche Intstitue, and MORSE Corp developers. A prototype of the Avalanche Prediction App was validated for slope calculation accuracy, snow pit assimilation, and forecast weather assimilation."
            ].concat(prSignature)
});

morsePRs.push({
    prId: "pr_12_09_2015",
    title: "Avalanche Training",
    date: "December 09, 2015",
    author: "MORSE Corp",
    duration: "1 minute read",
    categories: ["news"],
    image: "images/news/mtwash.jpg",
    summary: 'MORSE Corp attended a six day Avalanche Training course in Jackson Hole, WY with the American Avalanche Institute.',
    content: ["MORSE Corp is developing an Android-based Avalanche Prediction application for the US DoD, and is leveraging the American Avalanche Institute's avalanche prediction worksheet. MORSE developers attended a 6 day avalanche prediction course with AAI and DoD user representatives."
            ].concat(prSignature)
});
