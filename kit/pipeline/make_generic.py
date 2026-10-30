import json
P=lambda t:{"t":"p","label":"","text":t}
N=lambda h:{"t":"n","html":h}
TXT=N("الأداة: ChatGPT أو Gemini (مخرج نصي)")
IMG=N("الأداة: Google Flow أو Gemini (صورة 16:9). لو عندك نموذج 3D: ارفع لقطة النموذج من نفس الزاوية كمرجع (Image-to-Image بقوة 0.35–0.5).")
BOARD=" Presented as a wide horizontal 16:9 board: the image fills most of the frame; a right-side vertical panel labels the main parts in short English; a bottom strip shows three small insets of key materials."
SIG=" Integrate the authorship signature exactly as \"{{SIGNATURE}}\" as a refined embossed signature in the lower right corner, sharp and correctly spelled."
def img(t,board=True): return P(t+(BOARD if board else "")+SIG)
S=[]
def stage(code,title,steps): S.append({"num":f"{len(S)+1:02d}","code":code,"title":title,"intro":"","steps":steps})
def st(code,ar,en,items,check): return {"code":code,"ar":ar,"en":en,"items":items,"check":check}

stage("BRF","الفكرة والبرنامج",[
 st("BRF-00","بطاقة المشروع (المُدخل)","Project Intake",[TXT,N("اكتب تفاصيل مشروعك مكان النص بين القوسين، والناتج JSON بيتحط في <b>facts.json</b> ويملأ كل البرومبتات الجاية تلقائيًا."),
  P("Act as a senior architect and design-brief consultant. I will describe a project in my own words (any language). Turn it into a clean project card. Ask me at most 3 short questions only if a critical fact is missing (site size, main use, or location); otherwise infer sensible values and mark them \"assumed\". Then output ONLY one JSON object, no prose, with these keys: NAME (short project name, neutral, not a real brand), TYPE (building type), PLACE (city, region, country), SITE (plot size, shape, orientation, streets, neighbours, views, topography), AREA (gross built area and key counts: floors, units, rooms, seats), PROGRAM (list of spaces with areas or counts), USERS (who uses it and how), CLIMATE (sun, wind, temperature, humidity, rain, salt or sand), STYLE (architectural language in one sentence), MATERIALS (5–8 facade and interior materials), PALETTE (4–6 colours in words), STRUCTURE (structural system and grid), MEP (key services and sustainability measures), CODES (local authorities and codes to respect, generic), DNA (one English paragraph of 120–160 words describing the project for image prompts: massing, heights, facade rhythm, materials, palette, landscape, context, light), RULES (ten English realism rules for this building type and place, one line each), SIGNATURE (author name for images or empty). My project: [اكتب هنا وصف مشروعك: النوع، المكان، المساحة، البرنامج، الطراز، أي صور أو قيود]")],
  "كل المفاتيح موجودة، والـ DNA بالإنجليزي ومن غير أسماء تجارية حقيقية."),
 st("BRF-01","البريف والبرنامج","Design Brief and Space Program",[TXT,
  P("Act as a senior architect for {{TYPE}} projects in {{PLACE}}. Using this project card — name {{NAME}}; site {{SITE}}; area {{AREA}}; program {{PROGRAM}}; users {{USERS}}; climate {{CLIMATE}}; style {{STYLE}} — prepare a design brief: 1) a vision in four sentences; 2) goals and users; 3) a space-program table Zone | Space | Area m2 / Count | Key requirement; 4) the planning strategy: access, zoning, orientation, phasing; 5) technical principles: structure {{STRUCTURE}}, services {{MEP}}, approvals under {{CODES}}. Write in Arabic, neutral branding, no marketing language.")],
  "البرنامج متوافق مع المساحة، ومفيش فراغ ناقص من بطاقة المشروع."),
 st("BRF-02","التقسيم الوظيفي والحركة","Zoning and Flows Diagram",[IMG,
  img("Create a clean architectural zoning and circulation diagram for {{NAME}}, a {{TYPE}} in {{PLACE}}. Top-down site plan of {{SITE}} with colour-coded zones from this program: {{PROGRAM}}; arrows for main, service and emergency flows; north arrow and scale bar; soft watercolour wash on white paper, crisp line work, short English labels.")],
  "المناطق مفصولة بوضوح، ومسار الخدمة منفصل عن الزوار."),
 st("BRF-03","لوحة الهوية والمزاج","Identity and Mood Board",[IMG,
  img("Create an architectural mood board for {{NAME}}: {{STYLE}}. Material samples {{MATERIALS}}, colour palette {{PALETTE}}, reference details, light mood and planting typical of {{PLACE}}, arranged as a refined collage on warm paper with small English captions.",False)],
  "الخامات والألوان نفس اللي في بطاقة المشروع."),
])
stage("SITE","الرفع والتحليل والوصلات",[
 st("SITE-01","الرفع المساحي","Site Survey",[IMG,img("Create a precise topographic survey drawing of the site of {{NAME}} in {{PLACE}}: {{SITE}}. Boundary with coordinates, levels, existing trees and structures, street names generic, setbacks dashed, north arrow, scale bar, survey table; technical drawing style on white with thin black and blue lines.")],"حدود وأبعاد ومناسيب واضحة، ومفيش مباني مقترحة لسه."),
 st("SITE-02","تحليل الشمس والرياح","Sun, Wind and Climate Analysis",[IMG,img("Create an environmental analysis diagram for the site of {{NAME}}: sun paths for summer and winter, prevailing winds, noise sources, views, and climate {{CLIMATE}}; annotated arrows and soft colour gradients over a light site plan; short English labels and a legend.")],"اتجاه الشمال والرياح السائدة صح للمكان."),
 st("SITE-03","الوصلات والمرافق","Access and Utilities",[IMG,img("Create a site access and utilities plan for {{NAME}}: vehicle and pedestrian entries, parking, drop-off, service yard, water, power, drainage and telecom connections ({{MEP}}); clean technical plan with colour-coded networks and a legend.")],"مدخل الخدمة بعيد عن المدخل الرئيسي."),
])
stage("PLAN","المخططات والمساقط",[
 st("PLAN-01","المخطط العام","Masterplan",[IMG,img("Create a rendered masterplan of {{NAME}}, top-down at 1:500 look: building footprints from this program {{PROGRAM}}, landscape, paths, parking and context of {{SITE}}; soft shadows, watercolour greens, crisp outlines, short English labels, north arrow and scale bar.")],"الكتل والمساحات منطقية مع بطاقة المشروع."),
 st("PLAN-02","مسقط الدور الأرضي","Ground Floor Plan",[IMG,img("Create a furnished architectural ground floor plan of {{NAME}} ({{TYPE}}): structure grid {{STRUCTURE}}, walls with black poche, doors, furniture, room names and areas in English, dimensions, entrance arrows; clean CAD-like drawing on white.")],"المداخل والسلالم والمصاعد في أماكن منطقية."),
 st("PLAN-03","مسقط الدور المتكرر","Typical Floor Plan",[IMG,img("Create a furnished typical upper floor plan of {{NAME}} on the same grid as the ground floor: cores aligned, wet areas stacked, room names and areas in English, dimensions; clean CAD-like drawing on white.")],"الكور فوق الكور، والحمامات فوق بعض."),
 st("PLAN-04","القطاع","Building Section",[IMG,img("Create a detailed architectural section through {{NAME}}: floor-to-floor heights, slabs, foundations, roof, stair core, levels in metres, people for scale, landscape and street; black poche cut, light grey beyond, short English labels.")],"المناسيب واضحة والقطاع ماشي في مكان مفيد."),
])
REF_E=" Keep exactly the same building, massing, materials and palette as the reference image."
stage("EXT","المشاهد الخارجية",[
 st("EXT-01","لقطة الدرون (المرجع)","Aerial Hero View",[IMG,img("Create a hyper-realistic drone photograph of {{NAME}} in {{PLACE}} at golden hour, about 120 m away at 35 degrees. {{DNA}} Surrounding context of {{SITE}}, a few people and cars for scale. Luminous, calm, realistic.")],"ولّدها الأول من غير جملة اللوحة والتوقيع: دي صورة المرجع للمشروع كله."),
 st("EXT-02","المدخل الرئيسي","Main Entrance",[IMG,img("Create a hyper-realistic eye-level photograph of the main entrance of {{NAME}}: canopy, signage-free facade, materials {{MATERIALS}}, people arriving, soft afternoon light, 24 mm lens."+REF_E)],"نفس الخامات والإيقاع اللي في المرجع."),
 st("EXT-03","الواجهة الرئيسية","Main Facade",[IMG,img("Create a hyper-realistic frontal photograph of the main facade of {{NAME}} from across the street, two-point perspective corrected, palette {{PALETTE}}, street trees and pedestrians."+REF_E)],"الواجهة مستقيمة ومفيش تشويه في الخطوط الرأسية."),
 st("EXT-04","زاوية ثلاثة أرباع","Three-Quarter View",[IMG,img("Create a hyper-realistic three-quarter street view of {{NAME}} showing two facades and the corner, late afternoon, long soft shadows, context of {{PLACE}}."+REF_E)],"الركن متسق مع المسقط."),
 st("EXT-05","الفراغ الخارجي واللاندسكيب","Landscape and Outdoor Space",[IMG,img("Create a hyper-realistic photograph of the main outdoor space of {{NAME}}: landscape typical of {{PLACE}}, shading, seating, water or planting, people using it naturally."+REF_E)],"النباتات مناسبة للمناخ."),
 st("EXT-06","لقطة الغروب","Sunset View",[IMG,img("Create a hyper-realistic blue-hour photograph of {{NAME}} with warm interior lights glowing and a deep blue sky."+REF_E)],"الإضاءة الداخلية دافية ومتوزعة بشكل منطقي."),
 st("EXT-07","الخدمة والخلفية","Service and Rear",[IMG,img("Create a realistic photograph of the rear and service side of {{NAME}}: service yard, plant room, waste and delivery area, screened and tidy."+REF_E)],"الخدمة مخفية ومنظمة."),
])
REF_I=" Keep the same architecture and material language as the interior reference."
stage("INT","المشاهد الداخلية",[
 st("INT-01","الفراغ الرئيسي (مرجع الداخل)","Main Interior Space",[IMG,img("Create a hyper-realistic interior photograph of the main space of {{NAME}} ({{TYPE}}): {{STYLE}}, materials {{MATERIALS}}, palette {{PALETTE}}, natural daylight, people using it, 24 mm lens.")],"ولّدها نظيفة من غير لوحة وتوقيع: دي مرجع الداخل."),
 st("INT-02","فراغ ثانوي 1","Secondary Space 1",[IMG,img("Create a hyper-realistic interior photograph of a key secondary space from this program: {{PROGRAM}}; realistic furniture and lighting, people."+REF_I)],"الفراغ من البرنامج فعلًا."),
 st("INT-03","فراغ ثانوي 2","Secondary Space 2",[IMG,img("Create a hyper-realistic interior photograph of another space from {{PROGRAM}}, different light time of day."+REF_I)],"نفس لغة التشطيب."),
 st("INT-04","الحركة والسلالم","Circulation and Stairs",[IMG,img("Create a hyper-realistic interior photograph of the main stair and circulation of {{NAME}}, with wayfinding without readable text."+REF_I)],"الدرابزين وارتفاعات آمنة."),
 st("INT-05","الحمامات والخدمات","Wet Areas",[IMG,img("Create a hyper-realistic photograph of a typical washroom of {{NAME}}: accessible layout, durable finishes from {{MATERIALS}}."+REF_I)],"تصميم مناسب لذوي الهمم."),
 st("INT-06","فراغ مميز","Signature Space",[IMG,img("Create a hyper-realistic photograph of the most memorable interior moment of {{NAME}}: a double-height space, a courtyard view or a special feature fitting {{STYLE}}."+REF_I)],"لحظة مميزة من غير مبالغة."),
])
stage("DET","التفاصيل",[
 st("DET-01","تفصيلة الواجهة","Facade Detail",[IMG,img("Create a close-up architectural detail of the facade of {{NAME}}: joints, shading elements, window reveal and materials {{MATERIALS}}, with a small axonometric inset.")],"التفصيلة قابلة للتنفيذ."),
 st("DET-02","تفصيلة داخلية","Interior Detail",[IMG,img("Create a close-up interior detail of {{NAME}}: a junction of floor, wall and ceiling, lighting integration and finishes.")],"المواد نفسها في الداخل."),
 st("DET-03","لوحة الخامات","Material Board",[IMG,img("Create a physical material board for {{NAME}}: real samples of {{MATERIALS}} in palette {{PALETTE}}, labelled with short English names, soft studio light.",False)],"نفس خامات البطاقة."),
])
stage("TECH","اللوحات الهندسية والتنفيذ",[
 st("TECH-01","المنظومة الإنشائية","Structural System",[IMG,img("Create an exploded structural axonometric of {{NAME}}: foundations, columns and grid {{STRUCTURE}}, slabs, cores and roof, colour-coded, short English labels.")],"الكور والجريد زي المساقط."),
 st("TECH-02","الأنظمة والمرافق","MEP Systems",[IMG,img("Create an MEP systems diagram of {{NAME}}: HVAC, water, drainage, power, fire fighting and sustainability measures {{MEP}} as a clean cutaway axonometric with colour-coded networks.")],"غرف المعدات لها مكان واضح."),
 st("TECH-03","الاستدامة","Sustainability",[IMG,img("Create a sustainability strategy diagram for {{NAME}} in climate {{CLIMATE}}: shading, ventilation, daylight, water reuse, solar, materials; section-based infographic with icons.")],"الحلول مناسبة للمناخ."),
 st("TECH-04","مراحل التنفيذ","Construction Sequence",[IMG,img("Create a six-panel construction sequence of {{NAME}} from the empty site to completion: excavation, foundations, structure, envelope, finishes, landscape; same camera in every panel, realistic.",False)],"نفس زاوية الكاميرا في الستة."),
 st("TECH-05","البرنامج الزمني","Programme and Gantt",[TXT,P("Act as a project manager. Prepare a construction programme for {{NAME}} ({{AREA}}): phases, durations in weeks, dependencies, critical path and a Gantt table, plus key approvals under {{CODES}}. Write in Arabic.")],"مدة واقعية لحجم المشروع."),
])
stage("LIFE","الحياة اليومية",[
 st("LIFE-01","صباح في المشروع","Morning Life",[IMG,img("Create a candid lifestyle photograph of morning life at {{NAME}}: {{USERS}} arriving and using the place, warm natural light, realistic people."+REF_E,False)],"ناس طبيعية ومش مُصطنعة."),
 st("LIFE-02","لحظة استخدام","In Use",[IMG,img("Create a candid photograph of {{USERS}} enjoying the main space of {{NAME}} in the afternoon."+REF_I,False)],"الاستخدام مطابق لوظيفة المشروع."),
 st("LIFE-03","مساء في المشروع","Evening Life",[IMG,img("Create a candid evening photograph at {{NAME}}: lights on, people relaxing, calm atmosphere."+REF_E,False)],"الإضاءة الليلية دافية."),
])
stage("MKT","الهوية والتسويق والافتتاح",[
 st("MKT-01","غلاف البروشور","Brochure Cover",[IMG,P("Create an elegant brochure cover for {{NAME}} using the aerial hero image, a refined title area with the project name only, palette {{PALETTE}}, no fake logos or slogans.")],"اسم المشروع بس، من غير شعارات مزيفة."),
 st("MKT-02","بوست سوشيال","Social Visual",[N("الأداة: Google Flow أو Gemini (صورة 4:5 أو 9:16)"),P("Create a vertical social media visual for {{NAME}} from the best exterior view, with clean space at the top for a short headline, no text rendered.")],"مفيش نص مكتوب جوه الصورة."),
 st("MKT-03","بوستر رحلة المشروع","Project Journey Poster",[IMG,P("Create a poster showing the journey of {{NAME}} from site to opening in six small frames left to right (site, plan, structure, facade, interior, life), consistent architecture, refined layout.")],"الستة متسقين مع بعض."),
])
stage("MOV","الفيديو ولقطات التحريك",[
 st("MOV-01","من الشارع للمدخل","Street to Entrance",[N("الأداة: Veo 3 في Flow · إطار البداية: EXT-03 · إطار النهاية: EXT-02"),P("Smooth forward gimbal walk at eye level from the street toward the main entrance of {{NAME}}, consistent architecture and materials, no morphing, gentle ambient sound.")],"الحركة ثابتة ومفيش تشوّه."),
 st("MOV-02","دوران درون","Drone Orbit",[N("الأداة: Veo 3 · إطار البداية: EXT-01"),P("Slow drone orbit around {{NAME}} at golden hour, 90 degrees, steady altitude, consistent building, soft wind sound.")],"المبنى ما يتغيرش أثناء الدوران."),
 st("MOV-03","تايم لابس التنفيذ","Construction Time-Lapse",[N("الأداة: Veo 3 · الإطارات: TECH-04 (البداية والنهاية) · لو عندك نموذج 3D: ابدأ من آخر فريم في الهيرو"),P("Construction time-lapse of {{NAME}} from the empty site to the completed building, fixed camera matching the start frame, crews and cranes, day cycles, ending on the completed hero view.")],"الكاميرا ثابتة ونهايته = صورة المرجع."),
])
J={"id":"generic","title":"مسار عام لأي مشروع — من بطاقة المشروع إلى الفيديو","name":"{{NAME}}","place":"{{PLACE}}","cat":"{{TYPE}}",
 "intro":"<p>مسار عام بـ 40 خطوة في 10 مراحل. ابدأ بـ <b>BRF-00</b>: اكتب وصف مشروعك، والناتج (بطاقة JSON) بيملأ كل البرومبتات الجاية. القيم بين {{ }} بتتبدل تلقائيًا.</p>",
 "info":[{"h":"المشروع","html":"<p>{{DNA}}</p><table><tr><td>المكان</td><td>{{PLACE}}</td></tr><tr><td>الأرض</td><td>{{SITE}}</td></tr><tr><td>المساحة</td><td>{{AREA}}</td></tr><tr><td>البرنامج</td><td>{{PROGRAM}}</td></tr><tr><td>الطراز</td><td>{{STYLE}}</td></tr><tr><td>الخامات</td><td>{{MATERIALS}}</td></tr></table>"}],
 "locks":[{"n":"1","title":"الهوية (Project DNA)","parts":[{"label":"","text":"PROJECT DNA — {{NAME}}, {{PLACE}}. {{DNA}}"}]},
          {"n":"2","title":"قواعد الواقعية (Authenticity Lock)","parts":[{"label":"","text":"REALISM RULES: {{RULES}}"}]},
          {"n":"3","title":"الإخراج (Board Layout)","parts":[{"label":"","text":BOARD.strip()}]},
          {"n":"4","title":"التوقيع","parts":[{"label":"","text":SIG.strip()}]},
          {"n":"5","title":"جمل المرجع","parts":[{"label":"EXTERIOR","text":REF_E.strip()},{"label":"INTERIOR","text":REF_I.strip()}]}],
 "stages":S,
 "errors":[{"e":"المبنى اتغير عن المرجع","fix":"Keep everything the same as the reference image; only change the camera as described."},
           {"e":"نص أو لافتات مقروءة في الصورة","fix":"Keep everything the same; remove all readable text, signs and logos."},
           {"e":"مقياس غلط للناس أو العربيات","fix":"Keep everything the same; correct the scale of people and cars to match a floor height of about 3.2 m."},
           {"e":"خطوط رأسية مايلة","fix":"Keep everything the same; correct the perspective so all vertical lines are vertical."},
           {"e":"خامات مختلفة عن البطاقة","fix":"Keep everything the same; use only these materials: {{MATERIALS}}."}],
 "usage":"<ol><li>شغّل BRF-00 واحفظ الناتج facts.json.</li><li>املأ المسار: <code>python fill-pipeline.py generic.pipeline.json facts.json &lt;slug&gt;.pipeline.json</code></li><li>ابدأ بـ EXT-01 و INT-01 نضاف (مرجعين)، وبعدين كمّل بالترتيب.</li></ol>"}
J["count"]=sum(len(s["steps"]) for s in S)
json.dump(J,open("generic.pipeline.json","w",encoding="utf-8"),ensure_ascii=False,indent=1)
print(J["count"],[ (s["code"],len(s["steps"])) for s in S])
