/**
 * NSFW Sex Video Prompt Skill — structured building blocks
 * Shared by UI (index.html/app.js) and SKILL_DRAFT.md concepts.
 * HARD RULE: all subjects are adults 21+. Fictional CNC/dark fantasy allowed. No minors, no age-ambiguous, no real celebrities, no snuff/gore, no bestiality.
 */
window.PROMPT_DATA = {
  meta: {
    title: "性爱视频提示词组合器",
    version: "1.3.0",
    ageGate: "21+ ONLY — 虚构成人内容。允许成人(21+)间 CNC/强制/轮奸/调教/迷奸等暗黑幻想描写；禁止未成年、年龄模糊、真实人物姓名/肖像、虐杀/极端血腥、兽交。",
    models: [
      { id: "minimax_h3", label: "MINIMAX H3（Hailuo/海螺类）", hint: "单次生成最长约 15s；偏运动/运镜/声景；I2V 少写外貌" },
      { id: "qwen_image", label: "QWEN IMAGE 2.1", hint: "偏详细姿势/场景描写；适合定帧再 I2V" }
    ],
    modes: [
      { id: "i2v", label: "图文生视频 (I2V)", hint: "首帧/参考图定身份；提示词写动作时序与运镜" },
      { id: "multiref", label: "多参考生视频 (Multi-ref)", hint: "分配主体A/B、姿势、场景、风格槽位" }
    ],
    editModes: [
      { id: "continuous", label: "一镜到底", hint: "单一连续镜头；动作之间用 morph/transition 衔接，保持身份、接触点、运镜平滑" },
      { id: "multicut", label: "多镜头", hint: "每段一个镜头；段间用 cut / match cut / raccord（匹配视线、动作惯性、出入画）" }
    ],
    durationPresets: [3, 5, 8, 10, 15],
    h3MaxSeconds: 15,
    h3Note: "MINIMAX H3 单次片段上限约 15 秒。时间轴总长超过 15s 时，会自动拆成多条各自 ≤15s 的生成任务（用上一段末帧衔接），而不是指望一次出 20–30s。"
  },

  /* —— 主体组合 —— */
  subjects: [
    { id: "mf", label: "男女 (M/F)", en: "one adult man and one adult woman, both clearly 21+", zh: "一名成年男性与一名成年女性，双方明显21岁以上" },
    { id: "mm", label: "男男 (M/M)", en: "two adult men, both clearly 21+", zh: "两名成年男性，双方明显21岁以上" },
    { id: "ff", label: "女女 (F/F)", en: "two adult women, both clearly 21+", zh: "两名成年女性，双方明显21岁以上" },
    { id: "mf_plus", label: "三人·双女一男 (21+)", en: "three consenting adults 21+: two women and one man", zh: "三名自愿成年人(21+)：两女一男" },
    { id: "mf_plus2", label: "三人·双男一女 (21+)", en: "three consenting adults 21+: two men and one woman", zh: "三名自愿成年人(21+)：两男一女" },
    { id: "gang_mf", label: "一女多男(21+)", en: "one adult woman and multiple adult men, all clearly 21+, fictional gangbang fantasy", zh: "一名成年女性与多名成年男性，全部明显21+，虚构轮奸幻想" },
    { id: "gang_mm", label: "一男多男(21+)", en: "one adult man and multiple adult men, all clearly 21+, fictional group fantasy", zh: "一名成年男性与多名成年男性，全部明显21+，虚构群戏幻想" },
    { id: "gang_ff", label: "一女多女(21+)", en: "one adult woman and multiple adult women, all clearly 21+, fictional group fantasy", zh: "一名成年女性与多名成年女性，全部明显21+，虚构群戏幻想" }
  ],

  bodyTags: [
    { id: "athletic", label: "精壮/健美", en: "athletic toned adult physique", zh: "精壮匀称成人体型" },
    { id: "curvy", label: "丰满曲线", en: "curvy soft adult physique", zh: "丰满柔和曲线成人体型" },
    { id: "slim", label: "纤瘦修长", en: "slim elongated adult physique", zh: "纤瘦修长成人体型" },
    { id: "muscular", label: "肌肉发达", en: "muscular adult physique", zh: "肌肉发达成人体型" },
    { id: "plus", label: "丰腴厚实", en: "plus-size soft adult physique", zh: "丰腴厚实成人体型" },
    { id: "average", label: "普通自然", en: "average natural adult physique", zh: "普通自然成人体型" }
  ],

  /* —— 场景 15+ —— */
  scenes: [
    { id: "bedroom_night", label: "卧室·夜灯", en: "dim warm bedroom at night, rumpled sheets, soft bedside lamp glow, intimate atmosphere", zh: "夜间暖色卧室，凌乱床单，床头灯柔光，私密氛围" },
    { id: "hotel_suite", label: "酒店套房", en: "upscale hotel suite, large bed, city night lights through sheer curtains, cool ambient LEDs", zh: "高端酒店套房，大床，薄纱窗帘透出城市夜景，冷暖氛围灯" },
    { id: "bathroom_steam", label: "浴室蒸汽", en: "steamy bathroom, wet tiles, fogged mirror, warm overhead light, water droplets on skin", zh: "蒸汽浴室，湿瓷砖，起雾镜子，暖顶灯，皮肤水珠" },
    { id: "shower", label: "淋浴间", en: "walk-in shower, cascading water, glass enclosure, slick wet skin under white steam", zh: "淋浴间流水，玻璃隔断，白雾中湿滑皮肤" },
    { id: "kitchen_counter", label: "厨房台面", en: "modern kitchen, marble counter edge, afternoon window light, casual domestic heat", zh: "现代厨房大理石台边，午后窗光，家居暧昧" },
    { id: "living_sofa", label: "客厅沙发", en: "living-room sofa, soft cushions, evening lamp, TV glow in background", zh: "客厅沙发软垫，晚间台灯，背景电视微光" },
    { id: "car_backseat", label: "车内后座", en: "car backseat at night, dashboard glow, steamed windows, cramped intimate space", zh: "夜间车后座，仪表盘微光，起雾车窗，局促私密" },
    { id: "office_afterhours", label: "办公室加班", en: "empty office after hours, desk lamp only, blinds half-closed, risky quiet tension", zh: "下班后空办公室，仅台灯，半闭百叶，安静紧张" },
    { id: "balcony_dusk", label: "阳台黄昏", en: "private balcony at dusk, city haze, warm sunset rim light, discreet outdoor intimacy", zh: "私人阳台黄昏，城市薄雾，暖日落轮廓光，隐蔽户外亲密" },
    { id: "outdoor_hidden", label: "户外隐蔽", en: "secluded outdoor nook, dappled tree shade, distant path empty, cautious adult secrecy", zh: "隐蔽户外角落，树影斑驳，远处无人，谨慎成人私密" },
    { id: "poolside_night", label: "泳池夜色", en: "night poolside, blue water reflections on wet skin, quiet villa lighting", zh: "夜间泳池边，蓝水光反射湿肤，别墅静光" },
    { id: "mirror_room", label: "对镜房间", en: "bedroom with full-length mirror, dual reflections of adult bodies, soft vanity lights", zh: "带落地镜卧室，成人体态双影，化妆台柔光" },
    { id: "window_rain", label: "雨窗窗台", en: "rainy window ledge, streaked glass, cool grey daylight, warm indoor contrast", zh: "雨天窗台，玻璃水痕，冷灰日光与室内暖对比" },
    { id: "hot_tub", label: "按摩浴缸", en: "bubbling hot tub, candlelight, rising steam, wet shoulders above waterline", zh: "冒泡按摩浴缸，烛光蒸汽，水线上湿润肩颈" },
    { id: "locker_gym", label: "健身房更衣室", en: "empty gym locker room after hours, metal lockers, harsh overhead fluorescents softened by steam", zh: "下班后空更衣室，金属柜，顶灯与蒸汽柔化" },
    { id: "tent_camping", label: "露营帐篷", en: "small camping tent interior, sleeping bags, lantern glow, fabric walls close around adults", zh: "小帐篷内，睡袋，露营灯暖光，布壁贴近" },
    { id: "yacht_cabin", label: "游艇舱室", en: "yacht cabin berth, gentle sway, porthole moonlight, polished wood panels", zh: "游艇舱铺，轻晃，舷窗月光，木板饰面" },
    { id: "library_private", label: "私人书房", en: "private study lined with bookshelves, leather armchair, warm reading lamp", zh: "私人书房书架，皮椅，阅读灯暖光" },
    { id: "warehouse_dark", label: "废弃仓库", en: "abandoned warehouse at night, concrete pillars, single hanging bulb, dusty air, adult CNC fantasy set, all performers 21+", zh: "夜间废弃仓库，混凝土柱，孤灯，尘雾，成人口径 CNC 幻想场景，所有表演者21+" },
    { id: "locked_bedroom", label: "上锁卧室", en: "locked bedroom interior, door bolted, dim lamp, rumpled bed, private adult non-con fantasy between adults 21+", zh: "上锁卧室，门闩，昏灯，凌乱床，21+成人非自愿幻想私密空间" },
    { id: "motel_dark", label: "廉价旅馆暗房", en: "cheap motel room at night, thin curtains, neon bleed, stained carpet, dark adult fantasy atmosphere, adults 21+", zh: "廉价旅馆夜房，薄帘霓虹渗光，暗色成人幻想氛围，21+" },
    { id: "dungeon_playroom", label: "地牢玩乐室", en: "private BDSM dungeon playroom, padded bench, wall restraints, warm low lights, consensual-looking extreme adult play set for adults 21+", zh: "私人 BDSM 地牢玩乐室，软垫长椅，墙缚具，暖低光，21+成人极端玩法布景" },
    { id: "van_interior", label: "厢式车内", en: "cargo van interior, metal walls, folded blanket, confined adult kidnapping-fantasy set, all adults clearly 21+", zh: "厢式货车内，金属壁，折叠毯，局促绑架幻想布景，所有人明显21+" },
    { id: "alley_night", label: "夜巷角落", en: "narrow alley at night, wet asphalt, distant streetlight, risky public adult CNC fantasy, adults 21+", zh: "夜间窄巷，湿沥青，远处路灯，公共风险成人 CNC 幻想，21+" },
    { id: "office_coerce", label: "办公室胁迫幻想", en: "empty office after hours, blinds shut, desk cleared, adult blackmail/coercion fantasy between adults 21+", zh: "下班后空办公室，百叶紧闭，桌面腾空，21+成人胁迫幻想" },
    { id: "club_vip", label: "俱乐部 VIP 包厢", en: "club VIP backroom, leather booth, bass thump muffled, purple accent lights, adult dark fantasy, 21+", zh: "俱乐部 VIP 包厢，皮座，低沉贝斯，紫光，成人暗黑幻想，21+" },
    { id: "basement_cellar", label: "地下室", en: "dim basement cellar, concrete floor, single lamp, adult captivity fantasy set, performers 21+", zh: "昏暗地下室，水泥地，孤灯，成人囚禁幻想，表演者21+" },
    { id: "hotel_penthouse_dark", label: "顶层套房暗调", en: "dark luxury penthouse suite, city lights through glass, dramatic shadows, intense adult fantasy, 21+", zh: "暗调豪华顶层套房，玻璃外城市灯火，戏剧阴影，激烈成人幻想，21+" }
  ],

  /* —— 前戏 —— */
  foreplay: [
    { id: "kiss_deep", label: "深吻纠缠", en: "deep passionate kissing, tongues slow then urgent, hands in hair", zh: "深吻，舌尖由缓至急，双手插发" },
    { id: "neck_kiss", label: "吻颈咬耳", en: "trailing kisses down the neck, soft bite near the ear, whispered breath", zh: "吻沿颈部下移，轻咬耳侧，气息低语" },
    { id: "breast_play", label: "胸部爱抚", en: "hands and mouth caressing breasts, nipples teased with tongue and fingertips", zh: "手口爱抚胸部，舌尖与指尖挑逗乳尖" },
    { id: "body_oil", label: "全身按摩油", en: "warm massage oil slid over backs and hips, long slow strokes building arousal", zh: "温热精油滑过背与臀，长缓抚触升温" },
    { id: "grind_clothed", label: "隔衣摩擦", en: "still partly clothed grinding, fabric friction against arousal, urgent undressing begins", zh: "半着装摩擦，布料蹭欲望，急促解衣" },
    { id: "strip_tease", label: "互脱衣", en: "slow mutual undressing, eyes locked, garments dropped piece by piece", zh: "缓慢互脱，眼神锁定，衣物一件件落地" },
    { id: "fingering", label: "手指前戏", en: "skilled fingers stroking and circling wet arousal, slow build before penetration", zh: "手指娴熟抚弄湿润欲望，进入前缓慢升温" },
    { id: "handjob", label: "手部刺激", en: "firm slow hand strokes along the shaft, thumb teasing the head, precum glistening", zh: "手掌握住缓慢撸动，拇指挑逗顶端，前液闪亮" },
    { id: "mutual_mast", label: "互相手淫", en: "both adults stroking each other face to face, shared rhythm and eye contact", zh: "面对面互相手刺激，同步节奏与对视" },
    { id: "toy_vibe", label: "跳蛋/震动棒", en: "small vibrator pressed to clit or perineum, buzzing intensity rising in waves", zh: "小震动器抵住敏感处，震动强度波浪上升" }
  ],

  /* —— 口交 —— */
  oral: [
    { id: "bj_kneel", label: "跪姿口交", en: "kneeling oral sex, lips sliding along the shaft, eye contact upward, saliva shine", zh: "跪姿口交，唇沿柱身滑动，上抬对视，唾液光泽" },
    { id: "bj_deep", label: "深喉尝试", en: "deep-throat attempt with careful control, throat accepting length, tears of effort, adult consent clear", zh: "可控深喉，喉部容纳，用力泪光，明确成年自愿" },
    { id: "bj_lick", label: "舔舐龟头", en: "slow tongue circles around the glans, teasing underside, building wetness", zh: "舌尖缓绕龟头，挑逗系带，湿润堆积" },
    { id: "cunnilingus", label: "舔阴", en: "oral on vulva, tongue tracing clit in slow circles then firmer strokes, hips rolling", zh: "口舌抚弄阴户，绕阴蒂由缓渐强，髋部扭动" },
    { id: "anilingus", label: "舔肛", en: "rimming with slow careful tongue, hands spreading cheeks, intimate trust between adults", zh: "缓慢谨慎舔肛，双手分开臀瓣，成人亲密信任" },
    { id: "69", label: "69式", en: "sixty-nine position, mutual oral, stacked adult bodies, simultaneous pleasure", zh: "六九式互相口交，成人体叠，同步快感" },
    { id: "face_sit", label: "坐脸", en: "facesitting, thighs framing face, oral from below, hands gripping hips", zh: "坐脸，大腿框住面部，下方口交，双手抓髋" },
    { id: "titjob", label: "乳交", en: "breast sex, shaft sliding between pressed breasts, tongue reaching the tip", zh: "阴茎在挤压乳沟间滑动，舌尖够到顶端" },
    { id: "oral_edge", label: "口交边缘控制", en: "oral edging, stopping just before climax, teasing breath on wet skin", zh: "口交边缘控制，高潮前停下，气息拂过湿肤" }
  ],

  /* —— 性交姿势 25+ —— */
  sexPoses: [
    { id: "missionary", label: "传教士", en: "missionary position, receiver on back legs wrapped around partner, deep face-to-face thrusts", zh: "传教士：仰躺双腿环腰，面对面深顶" },
    { id: "missionary_legs_up", label: "传教士·抬腿", en: "missionary with legs raised on shoulders, deeper angle, belly and eye contact", zh: "传教士抬腿上肩，更深角度，腹与对视" },
    { id: "missionary_pillow", label: "传教士·垫臀", en: "missionary with hips elevated on pillow, angled penetration, controlled pace", zh: "臀下垫枕传教士，角度进入，可控节奏" },
    { id: "doggy", label: "后入", en: "doggy style, on all fours, partner thrusting from behind, hands on hips", zh: "后入四肢着地，身后抽送，双手握髋" },
    { id: "doggy_chest_down", label: "后入·趴胸", en: "prone bone variation, chest down ass up, deep rear entry, sheets gripped", zh: "胸贴床臀抬高，深后入，抓紧床单" },
    { id: "doggy_standing_bend", label: "站立弯腰后入", en: "standing bent-over rear entry, hands on bed or wall, legs slightly apart", zh: "站立弯腰后入，手撑床或墙，双腿微开" },
    { id: "cowgirl", label: "骑乘·正向", en: "cowgirl riding facing partner, hips rolling and bouncing, hands on chest", zh: "正向骑乘面对伴侣，髋部扭 bounce，手撑胸" },
    { id: "reverse_cowgirl", label: "骑乘·背向", en: "reverse cowgirl, riding facing away, arched back, partner watching from behind", zh: "背向骑乘，弓背，伴侣从后观赏" },
    { id: "cowgirl_grind", label: "骑乘·磨动", en: "cowgirl grinding circles more than bouncing, clit friction, slow deep seats", zh: "骑乘以磨圆为主少 bounce，阴蒂摩擦，缓深坐入" },
    { id: "spooning", label: "侧入汤匙", en: "spooning side entry, bodies nested, one leg lifted, intimate slow thrusts", zh: "侧躺汤匙式进入，身体嵌合，抬一腿，亲密缓顶" },
    { id: "side_scissor", label: "侧位剪刀", en: "sideways scissoring mixed with penetration or tribbing, entangled adult legs", zh: "侧位剪刀纠缠，可配合进入或磨阴，腿部交缠" },
    { id: "standing_lift", label: "站立抱起", en: "standing lift, partner held against wall, legs wrapped, strength and trust", zh: "站立抱起抵墙，双腿环腰，力量与信任" },
    { id: "standing_one_leg", label: "站立抬一腿", en: "standing sex with one leg raised and held, partial support on furniture", zh: "站立抬一腿被托住，家具半支撑" },
    { id: "edge_of_bed", label: "床沿", en: "receiver on edge of bed, standing partner between thighs, deep controlled strokes", zh: "躺床沿，站立伴侣在腿间，深控抽送" },
    { id: "table_edge", label: "桌沿", en: "perched on table or counter edge, legs open, partner standing thrusting", zh: "坐桌沿双腿分开，站立抽送" },
    { id: "chair_straddle", label: "椅上跨坐", en: "straddling on a chair, face to face, limited bounce, deep grind", zh: "椅上面对面跨坐，有限 bounce，深磨" },
    { id: "lap_sitting", label: "膝上坐入", en: "sitting in partner's lap facing or away, guided hips, closely pressed torsos", zh: "坐伴侣膝上（正/背向），引导髋部，胸腹紧贴" },
    { id: "lotus", label: "莲花坐", en: "lotus seated face-to-face embrace, legs wrapped, rock more than thrust", zh: "面对面莲花坐拥抱，腿相缠，以摇为主少猛抽" },
    { id: "pretzel", label: "麻花/扭曲", en: "pretzel-like twisted missionary, one leg between partner's, angled grind", zh: "扭曲传教士变体，一腿夹入，斜向磨顶" },
    { id: "butterfly", label: "蝴蝶式", en: "butterfly: hips at edge, legs spread wide in air or held, upward angle thrusts", zh: "蝴蝶式：髋在边缘腿大开，上顶角度" },
    { id: "pile_driver", label: "打桩式(温和)", en: "gentle piledriver-inspired angle with head supported by pillows, careful adult strength play — never unsafe", zh: "温和打桩角度，头颈有枕支撑，谨慎成人力量玩法" },
    { id: "amazon", label: "女上位压制", en: "amazon position, receiver on top pinning partner's legs, dominant grind", zh: "女上位压制伴侣腿，主导磨动" },
    { id: "from_behind_kneel", label: "跪姿身后抱", en: "both kneeling, entry from behind with arms wrapped around torso, intimate rear", zh: "双人跪姿后入环抱躯干，亲密后抱" },
    { id: "mirror_doggy", label: "对镜后入", en: "doggy facing a full-length mirror, watching their adult reflections while thrusting", zh: "面向落地镜后入，边抽送边看成人倒影" },
    { id: "mirror_cowgirl", label: "对镜骑乘", en: "cowgirl angled toward mirror, watching penetration and expressions", zh: "骑乘朝向镜子，观看结合与表情" },
    { id: "against_glass", label: "贴玻璃/窗", en: "pressed against cool glass or window, standing rear or face, city blur beyond", zh: "贴凉玻璃或窗，站立后入或面对，窗外城市虚化" },
    { id: "shower_wall", label: "淋浴抵墙", en: "shower wall support, wet slippery standing sex, water streaming over joined bodies", zh: "淋浴抵墙，湿滑站立性爱，水流过交合身体" },
    { id: "car_seat", label: "车内跨坐", en: "straddling in car seat, limited space, urgent short thrusts, steamed windows", zh: "车座跨坐，空间受限，急促短抽，车窗起雾" },
    { id: "anal_missionary", label: "肛交·传教士", en: "consensual anal missionary, plenty of lube implied, slow careful entry, check-in eye contact", zh: "自愿肛交传教士，暗示充足润滑，缓慢谨慎进入，眼神确认" },
    { id: "anal_doggy", label: "肛交·后入", en: "consensual anal doggy, gradual depth, hand on lower back, adult trust and pacing", zh: "自愿肛交后入，渐进深度，手按腰背，成人信任与节奏" },
    { id: "double_stim", label: "双重刺激", en: "penetration plus vibrator or fingers on clit/prostate, layered climax build", zh: "进入同时震动或手指刺激阴蒂/前列腺，叠加高潮" }
  ],

  /* —— 重口味·强制/非自愿幻想(21+虚构) —— */
  darkActs: [
    { id: "cnc_struggle_pin", label: "强制·挣扎压制(CNC)", en: "fictional adult CNC fantasy 21+: adult struggles while being firmly pinned to the bed/floor by another adult, wrists held, clothes half-torn, forced non-consensual fantasy between adults only", zh: "虚构成人 CNC 幻想(21+)：成人挣扎被另一成人牢牢压制在床/地，手腕按住，衣物半撕，仅限成人非自愿幻想" },
    { id: "cnc_tear_clothes", label: "强制·撕衣(CNC)", en: "fictional adult CNC 21+: rough tearing of clothing from a resisting adult body, fabric ripping, exposed skin, pinning hands, non-consensual fantasy between adults", zh: "虚构成人 CNC(21+)：对挣扎成人体粗暴撕衣，布料撕裂，肌肤暴露，按住手，成人非自愿幻想" },
    { id: "cnc_forced_entry", label: "强制·强行进入(CNC)", en: "fictional adult CNC 21+: forced penetration of a pinned struggling adult, rough deep thrusts, muffled cries, adult non-consensual fantasy only — all 21+", zh: "虚构成人 CNC(21+)：压制挣扎成人后强行进入，粗暴深顶，闷声哭喊，仅成人非自愿幻想" },
    { id: "cnc_rough_thrust", label: "强制·粗暴抽送(CNC)", en: "fictional adult CNC 21+: relentless rough thrusting while adult is held down, skin slap, desperate grip, non-con fantasy adults only", zh: "虚构成人 CNC(21+)：成人被按住时不停粗暴抽送，肌肤拍击，死死抓住，仅成人非自愿幻想" },
    { id: "cnc_muffled_cry", label: "强制·捂嘴闷叫(CNC)", en: "fictional adult CNC 21+: hand over mouth muffling cries during forced sex fantasy, tear-streaked adult face, adults 21+ only", zh: "虚构成人 CNC(21+)：强迫性交幻想中捂嘴闷叫，成人泪痕面容，仅21+" },
    { id: "cnc_hair_pull", label: "强制·抓发后入(CNC)", en: "fictional adult CNC 21+: hair pulled back during forced doggy-style fantasy, arched adult body, rough rear thrusts, adults only", zh: "虚构成人 CNC(21+)：强制后入幻想中抓发后仰，弓起成人体，粗暴后入，仅成人" },
    { id: "gang_surround", label: "轮奸·围拢(21+)", en: "fictional adult gangbang fantasy 21+: one adult woman surrounded by multiple adult men, hands on her body, taking turns setup, all clearly 21+", zh: "虚构成人轮奸幻想(21+)：一成年女性被多名成年男性围拢，接手体，轮流准备，全部明显21+" },
    { id: "gang_oral_train", label: "轮奸·口部轮流(21+)", en: "fictional adult gangbang 21+: multiple adult men taking turns oral on one adult, face surrounded, saliva shine, adults only", zh: "虚构成人轮奸(21+)：多名成年男性对一成人轮流口交，面部被围，唾液光泽，仅成人" },
    { id: "gang_penetration_chain", label: "轮奸·进入轮换(21+)", en: "fictional adult gangbang 21+: adult men taking turns penetrating one adult, held in position, continuous chain of thrusts, all 21+", zh: "虚构成人轮奸(21+)：多名成年男性轮流进入一成人，固定姿势，连续抽送链，全部21+" },
    { id: "gang_dp_fantasy", label: "轮奸·双插幻想(21+)", en: "fictional adult double-penetration gangbang fantasy between adults framed as CNC/dark fantasy, all performers clearly 21+", zh: "虚构成人双插轮奸幻想，以 CNC/暗黑幻想呈现，所有表演者明显21+" },
    { id: "gang_finish_marks", label: "轮奸·轮番结束痕迹(21+)", en: "fictional adult gangbang climax fantasy: multiple adult finishes on body, stylized marks, no gore, all adults 21+", zh: "虚构成人轮奸高潮幻想：多成人结束痕迹于身体，风格化痕迹非血腥，全部21+" },
    { id: "train_collar_leash", label: "调教·项圈牵引", en: "extreme adult BDSM training fantasy 21+: collar and leash on adult submissive, guided on all fours, dominant adult leading, fictional adults only", zh: "极端成人 BDSM 调教幻想(21+)：成人顺从者戴项圈被牵引四肢着地，主导成人引领，仅虚构成人" },
    { id: "train_spank_count", label: "调教·计数打臀", en: "adult training fantasy 21+: firm spanking with counted strikes on adult buttocks, reddened stylized skin, verbal discipline, adults only", zh: "成人调教幻想(21+)：对成人臀部计数拍打，风格化红痕，口头训诫，仅成人" },
    { id: "train_orgasm_control", label: "调教·高潮控制", en: "adult orgasm-control training 21+: forced edge then denied climax, trembling adult body, dominant commands, fictional adults", zh: "成人高潮控制调教(21+)：强制边缘后禁止高潮，颤抖成人体，主导命令，虚构成人" },
    { id: "train_forced_orgasm", label: "调教·强制高潮", en: "adult forced-orgasm training fantasy 21+: overstimulation to climax against resistance, vibrator or hands, adults only", zh: "成人强制高潮调教幻想(21+)：抗拒中被过度刺激至高潮，震动或手，仅成人" },
    { id: "train_pet_play", label: "调教·宠物扮演", en: "adult pet-play training fantasy 21+: collar, kneel, bowl aesthetic, humiliation-lite dialogue, clearly adult roleplay 21+", zh: "成人宠物扮演调教幻想(21+)：项圈跪姿碗具美学，轻度羞辱对白，明确成人角色扮演21+" },
    { id: "train_humiliate_talk", label: "调教·羞辱对白", en: "adult humiliation dialogue training fantasy 21+: dominant verbal degradation during restraint, submissive adult responses, fictional CNC/BDSM adults only", zh: "成人羞辱对白调教幻想(21+)：束缚中主导言语贬低，顺从成人回应，仅虚构 CNC/BDSM 成人" },
    { id: "train_position_hold", label: "调教·强制摆姿", en: "adult training 21+: forced to hold exposing positions for inspection, trembling thighs, collar, adults only", zh: "成人调教(21+)：强制保持暴露姿势受检视，大腿发抖，项圈，仅成人" },
    { id: "drug_drowsy_setup", label: "迷奸·昏沉铺垫(幻想)", en: "fictional adult drug-rape fantasy 21+ ONLY: drowsy heavy-lidded adult, limp limbs, dim room — framed as fantasy between adults, never imply real crime victims or minors", zh: "仅虚构成人迷奸幻想(21+)：昏沉半闭眼成人，四肢发软，昏室——明确幻想成人向，绝不暗示真实受害者或未成年" },
    { id: "drug_limp_use", label: "迷奸·软体使用(幻想)", en: "fictional adult sleep-sex / drug fantasy 21+: limp adult body carefully positioned and used while appearing unconscious-looking, soft breathing, adults 21+ fantasy only", zh: "虚构成人昏睡/迷奸幻想(21+)：软绵成人身体被摆放使用，看似无意识，轻呼吸，仅21+幻想" },
    { id: "drug_wake_halfway", label: "迷奸·半醒挣扎(幻想)", en: "fictional adult drug fantasy 21+: half-waking adult realizes being used, weak resistance, dazed eyes, CNC drug fantasy adults only", zh: "虚构成人迷奸幻想(21+)：半醒成人察觉被使用，无力挣扎，恍惚眼神，仅成人 CNC 迷药幻想" },
    { id: "kidnap_van_grab", label: "绑架幻想·拖入车", en: "fictional adult kidnapping fantasy setup 21+: adult seized and pulled into van interior, struggle briefly, door slam, adults only fantasy", zh: "虚构成人绑架幻想铺垫(21+)：成人被抓住拖入厢车，短暂挣扎，关门，仅成人幻想" },
    { id: "blackmail_coerce", label: "勒索胁迫幻想", en: "fictional adult blackmail coercion fantasy 21+: reluctant adult complies under threat dialogue, tense office/motel, adults only", zh: "虚构成人勒索胁迫幻想(21+)：威胁对白下勉强顺从，紧张办公室/旅馆，仅成人" },
    { id: "public_risk_almost", label: "公共风险·差点被发现", en: "adult public-risk almost-caught fantasy 21+: muffled sex in risky location, footsteps nearby, freeze then resume, adults only", zh: "成人公共风险差点被发现幻想(21+)：风险地点闷声性爱，附近脚步，停顿再继续，仅成人" },
    { id: "object_toy_insert", label: "器具插入", en: "adult object/toy insertion fantasy 21+: toy or plug inserted into restrained adult, careful explicit framing, adults only", zh: "成人器具插入幻想(21+)：玩具/塞对束缚成人插入，明确成人向，仅成人" },
    { id: "spit_play", label: "唾液玩法", en: "adult spit play fantasy 21+: spit on tongue/chest/face between adults during rough scene, degrading aesthetic, adults only", zh: "成人唾液玩法幻想(21+)：粗暴场景中成人间唾液于舌/胸/脸，贬低美学，仅成人" },
    { id: "slap_face_consensual_extreme", label: "掌掴(极端玩法外观)", en: "adult impact play fantasy 21+: open-hand slap to cheek during rough sex aesthetic, stylized not injurious gore, adults only", zh: "成人击打玩法幻想(21+)：粗暴性爱美学中开掌掴颊，风格化非重伤血腥，仅成人" },
    { id: "bondage_rope_full", label: "绳缚全身", en: "adult shibari-style full rope bondage 21+: intricate rope on adult torso and limbs, exposed, helpless pose, adults only", zh: "成人全身绳缚(21+)：躯干四肢复杂绳索，暴露无助姿势，仅成人" },
    { id: "ball_gag_wear", label: "口球佩戴", en: "adult ball-gag wear 21+: ball gag strapped, muffled sounds, drool, restrained adult, fantasy adults only", zh: "成人口球(21+)：口球固定，闷声涎水，束缚成人，仅幻想成人" },
    { id: "blindfold_dark", label: "蒙眼暗黑", en: "adult blindfold sensory deprivation 21+: opaque blindfold, heightened touch during dark fantasy scene, adults only", zh: "成人蒙眼感官剥夺(21+)：不透光眼罩，暗黑幻想中触觉放大，仅成人" },
    { id: "creampie_breed_talk", label: "中出·繁殖对白", en: "adult creampie breeding-talk fantasy 21+: internal finish with breeding dirty talk, adult CNC or consensual dark framing, adults only", zh: "成人中出繁殖对白幻想(21+)：体内结束配繁殖情色对白，CNC 或暗黑自愿框架，仅成人" },
    { id: "facial_finish", label: "颜射结束", en: "adult facial finish fantasy 21+: climax on adult face, closed eyes, stylized, adults only", zh: "成人颜射结束幻想(21+)：高潮于成人面部，闭眼，风格化，仅成人" },
    { id: "body_writing", label: "身体写字", en: "adult body-writing humiliation fantasy 21+: marker words on adult skin, degrading labels, adults only", zh: "成人体写字羞辱幻想(21+)：马克笔字迹于成人皮肤，贬低标签，仅成人" },
    { id: "marks_bruises_stylized", label: "痕迹/淤青风格化", en: "stylized adult marks and light bruises from rough play fantasy — not gore, not snuff — adults 21+ only", zh: "风格化成人粗暴玩法痕迹与浅淤青——非血腥非虐杀——仅21+成人" }
  ],

  /* —— 节奏强度 —— */
  rhythm: [
    { id: "slow_tender", label: "缓慢温柔", en: "slow tender rhythm, long deep strokes, lingering pauses, loving pace", zh: "缓慢温柔节奏，长深抽送，停顿留恋，深情步调" },
    { id: "building", label: "逐渐升温", en: "building intensity, starting gentle then speeding, breath syncing tighter", zh: "由缓渐快升温，呼吸逐渐同步" },
    { id: "rhythmic", label: "稳定节奏", en: "steady hypnotic thrusting rhythm, consistent depth, trance-like focus", zh: "稳定催眠般抽送，深度一致，专注入神" },
    { id: "intense", label: "激烈猛烈", en: "intense hard thrusts, skin slap, urgent grip, raw adult passion", zh: "激烈猛顶，肌肤拍击，紧握，原始激情" },
    { id: "edge_wave", label: "边缘波浪", en: "edging waves: surge then pull back, deny climax then resume harder", zh: "边缘波浪：冲向高潮又收回，延后后更猛" },
    { id: "afterglow", label: "余韵慢磨", en: "afterglow slow grind, soft kisses, spent breathing, gentle residual motion", zh: "余韵慢磨，轻吻，喘息平复，残留轻动" }
  ],

  /* —— 镜头 —— */
  cameras: [
    { id: "static", label: "固定机位", en: "locked-off static camera, no pan no zoom, subject motion only", zh: "固定机位，不摇不推，仅主体动作" },
    { id: "closeup_face", label: "面部特写", en: "tight close-up on faces and mouths, pleasure expressions fill frame", zh: "面部与唇部紧特写，快感表情充满画面" },
    { id: "closeup_join", label: "结合处特写", en: "intimate close-up on the point of penetration and wet contact, tasteful framing", zh: "结合点与湿润接触特写，克制构图" },
    { id: "medium", label: "中景半身", en: "medium shot mid-thigh up, bodies and faces readable, room context soft", zh: "中景大腿以上，身体与表情可读，环境虚化" },
    { id: "wide", label: "全景环境", en: "wide shot showing full adult bodies and room layout, cinematic space", zh: "全景展示成人体与房间布局，电影感空间" },
    { id: "push_in", label: "缓缓推进", en: "slow dolly push-in toward the couple, tension rising with proximity", zh: "镜头缓缓推向两人，距离拉近张力上升" },
    { id: "pull_out", label: "缓缓拉远", en: "slow pull-back revealing more of the scene and entangled bodies", zh: "缓缓拉远揭示更多场景与纠缠身体" },
    { id: "follow", label: "跟拍", en: "gentle tracking follow of hip motion, camera stays with the rhythm", zh: "轻柔跟拍髋部节奏，镜头随律动" },
    { id: "handheld", label: "手持微晃", en: "subtle handheld micro-shake, documentary intimacy, never chaotic", zh: "手持微晃，纪实亲密感，不混乱" },
    { id: "orbit", label: "环绕半圈", en: "smooth partial orbit around the couple, continuous not stepped", zh: "平滑半环绕两人，连续不跳切" },
    { id: "pov", label: "主观视角 POV", en: "point-of-view from one partner looking down or toward the other", zh: "一方主观视角俯视或望向另一方" },
    { id: "mirror_cam", label: "镜中构图", en: "composition through mirror reflection, real bodies and reflected action layered", zh: "经由镜子构图，实体与倒影动作叠层" },
    { id: "low_angle", label: "低机位仰拍", en: "low angle looking up along bodies, power and scale emphasized", zh: "低机位沿身体仰拍，力量与体量感" },
    { id: "over_shoulder", label: "过肩", en: "over-the-shoulder framing of one adult watching the other move", zh: "过肩构图，一方看另一方动作" }
  ],

  /* —— 表情与对白 —— */
  expressions: [
    { id: "breath_soft", label: "轻喘", en: "soft open-mouth breathing, quiet moans, eyelids heavy", zh: "微张口轻喘，低吟，眼睑沉重" },
    { id: "breath_hard", label: "急促喘息", en: "hard panting, louder moans timed to thrusts, flushed cheeks", zh: "急促喘息，随抽送加重呻吟，面颊潮红" },
    { id: "eye_contact", label: "深情对视", en: "locked eye contact between consenting adults, soft smile between gasps", zh: "自愿成人深情对视，喘息间浅笑" },
    { id: "bite_lip", label: "咬唇隐忍", en: "lower lip bitten to hold back sound, brow furrowed in pleasure", zh: "咬下唇忍声，眉心因快感微蹙" },
    { id: "whisper", label: "低语短句", en: "whispered short adult dialogue between breaths", zh: "喘息间低语成人短句", dialogue: true },
    { id: "dirty_talk", label: "情色短句", en: "brief consensual dirty talk, explicit but affectionate", zh: "简短自愿情色对白，露骨却亲昵", dialogue: true },
    { id: "name_moan", label: "唤名喘息", en: "moaning partner's name softly between thrusts", zh: "抽送间轻唤对方名字", dialogue: true },
    { id: "laugh_intimate", label: "亲密轻笑", en: "intimate quiet laugh mid-motion, playful adult chemistry", zh: "动作中亲密轻笑，玩味成人化学反应" },
    { id: "climax_face", label: "高潮表情", en: "climax expression: eyes half-closed, mouth open, body tensing then releasing", zh: "高潮表情：半闭眼张口，身体绷紧后释放" },
    { id: "fear_pleasure_mix", label: "恐惧与快感交织", en: "mixed fear and involuntary pleasure on adult face, brows knit, mouth open, CNC fantasy adults 21+", zh: "成人面部恐惧与非自愿快感交织，眉蹙张口，CNC 幻想21+" },
    { id: "muffled_sound", label: "闷声呜咽", en: "muffled whimpers behind hand or gag, wet eyes, adult CNC fantasy", zh: "手或口球后闷声呜咽，湿润眼睛，成人 CNC 幻想" },
    { id: "tears_cnc", label: "泪痕(成人CNC)", en: "tear tracks on flushed adult cheeks during non-con fantasy, clearly adult 21+", zh: "非自愿幻想中潮红成人颊上泪痕，明确成人21+" },
    { id: "dazed_drowsy", label: "恍惚昏沉", en: "dazed heavy-lidded adult expression, slack mouth, drug-fantasy aesthetic 21+", zh: "恍惚半闭眼成人表情，嘴微张，迷奸幻想美学21+" },
    { id: "defiant_glare", label: "反抗怒视", en: "defiant glare through tears while restrained, adult resistance, 21+", zh: "束缚中含泪怒视反抗，成人抵抗，21+" },
    { id: "breaking_submit", label: "逐渐臣服", en: "breaking into reluctant submission expression, eyes lowering, adult training arc 21+", zh: "逐渐勉强臣服表情，目光垂下，成人调教弧21+" }
  ],

  dialogueSnippets: [
    { id: "d1", label: "「慢一点…」", en: '<d>[Chinese] 慢一点…</d>', zh: "慢一点…" },
    { id: "d2", label: "「就是那里」", en: '<d>[Chinese] 就是那里…</d>', zh: "就是那里…" },
    { id: "d3", label: "「看着我」", en: '<d>[Chinese] 看着我。</d>', zh: "看着我。" },
    { id: "d4", label: "「别停」", en: '<d>[Chinese] 别停…</d>', zh: "别停…" },
    { id: "d5", label: "「我快到了」", en: '<d>[Chinese] 我快到了…</d>', zh: "我快到了…" },
    { id: "d6", label: "「Come here」", en: '<d>[English] Come here.</d>', zh: "Come here." },
    { id: "d7", label: "「Stay with me」", en: '<d>[English] Stay with me.</d>', zh: "Stay with me." },
    { id: "d8", label: "「You feel so good」", en: '<d>[English] You feel so good.</d>', zh: "You feel so good." },
    { id: "dd1", label: "「不许动」", en: "<d>[Chinese] 不许动。</d>", zh: "不许动。" },
    { id: "dd2", label: "「乖乖受着」", en: "<d>[Chinese] 乖乖受着。</d>", zh: "乖乖受着。" },
    { id: "dd3", label: "「数出来」", en: "<d>[Chinese] 数出来。</d>", zh: "数出来。" },
    { id: "dd4", label: "「谁允许你高潮了」", en: "<d>[Chinese] 谁允许你高潮了？</d>", zh: "谁允许你高潮了？" },
    { id: "dd5", label: "「Take it」", en: "<d>[English] Take it.</d>", zh: "Take it." },
    { id: "dd6", label: "「You are mine tonight」", en: "<d>[English] You are mine tonight.</d>", zh: "You are mine tonight." }
  ],

  /* —— 服装道具 —— */
  wardrobe: [
    { id: "nude", label: "全裸", en: "fully nude consenting adults, bare skin only", zh: "自愿成人全裸，仅肌肤" },
    { id: "lingerie", label: "情趣内衣未脱尽", en: "partial lingerie still on — straps slipped, panties aside", zh: "情趣内衣未脱尽：吊带滑落、内裤拨开" },
    { id: "shirt_only", label: "仅留上衣", en: "oversized shirt only, bare below, buttons half open", zh: "仅过大上衣，下身裸，扣子半开" },
    { id: "stockings", label: "长筒袜/吊带", en: "thigh-high stockings and garter, otherwise bare", zh: "长筒袜与吊带，其余裸露" },
    { id: "office_disheveled", label: "凌乱办公装", en: "disheveled office wear — blouse open, skirt hiked, tie loose", zh: "凌乱办公装：衬衫敞开、裙摆上推、领带松" },
    { id: "towel", label: "浴巾半裹", en: "towels half-dropped after shower, damp skin", zh: "浴后浴巾半落，皮肤潮湿" },
    { id: "blindfold", label: "眼罩(自愿)", en: "consensual soft blindfold, trust-focused sensory play", zh: "自愿软眼罩，信任向感官玩法" },
    { id: "silk_tie", label: "丝带轻缚(自愿)", en: "consensual silk-tie wrist restraint, clearly playful and safe", zh: "自愿丝带轻缚手腕，明确玩味安全" },
    { id: "vibrator_prop", label: "震动棒入镜", en: "vibrator visible in frame assisting stimulation", zh: "震动棒入镜辅助刺激" },
    { id: "lube", label: "润滑液可见", en: "lube bottle nearby, glossy wet sheen on skin and toy/shaft", zh: "润滑液瓶在侧，皮肤与器物闪亮湿泽" },
    { id: "condom", label: "安全套可见", en: "condom visibly in use, responsible adult sex", zh: "安全套使用可见，负责任成人性爱" },
    { id: "collar_play", label: "项圈玩法(自愿)", en: "consensual soft collar aesthetic, light BDSM flavor between adults", zh: "自愿软项圈美学，成人轻度 BDSM 风味" },
    { id: "torn_clothes", label: "撕破衣物", en: "torn and ripped clothing hanging off adult body, exposed skin, struggle aftermath aesthetic", zh: "撕破衣物挂在成人体上，肌肤暴露，挣扎后美学" },
    { id: "duct_tape", label: "胶带封口/束缚", en: "duct tape over mouth and/or binding adult wrists, dark fantasy prop, adults 21+", zh: "胶带封口及/或缚住成人手腕，暗黑幻想道具，21+" },
    { id: "rope_visible", label: "绳索可见", en: "visible bondage rope on adult limbs and torso", zh: "成人四肢与躯干可见绳缚" },
    { id: "collar_leash_set", label: "项圈牵引绳套装", en: "leather collar with attached leash on adult submissive, BDSM training aesthetic 21+", zh: "成人顺从者皮项圈与牵引绳，BDSM 调教美学21+" },
    { id: "blindfold_opaque", label: "不透光眼罩", en: "opaque black blindfold covering adult eyes", zh: "不透光黑眼罩遮住成人双眼" },
    { id: "ball_gag_prop", label: "口球道具", en: "ball gag strapped in adult mouth, saliva string", zh: "口球固定于成人口中，涎丝" },
    { id: "lingerie_ripped", label: "情趣内衣撕破", en: "ripped lingerie still partially on adult body, straps broken", zh: "撕破情趣内衣仍半挂成人体，吊带断裂" },
    { id: "tape_wrists", label: "胶封手腕", en: "wrists taped together above head on adult, restrained pose", zh: "成人手腕胶封于头顶，束缚姿势" }
  ],

  /* —— 叙事弧 —— */
  arcs: [
    { id: "arc_build", label: "前戏→进入→加速", en: "narrative arc: foreplay teasing → first entry → accelerating thrusts", zh: "叙事弧：前戏挑逗 → 初次进入 → 抽送加速" },
    { id: "arc_peak", label: "稳定→高潮→痉挛", en: "narrative arc: steady rhythm → climax peak → shuddering release", zh: "叙事弧：稳定节奏 → 高潮顶点 → 痉挛释放" },
    { id: "arc_full", label: "开始→高潮→余韵", en: "full arc: soft start → intense climax → tender afterglow cuddle", zh: "完整弧：温柔开始 → 激烈高潮 → 余韵拥抱" },
    { id: "arc_edge", label: "边缘→爆发", en: "arc: repeated edging denial → final explosive climax", zh: "弧：多次边缘压抑 → 最终爆发高潮" },
    { id: "arc_quickie", label: "急促Quickie", en: "quickie arc: urgent undress → short intense sex → breathless pause", zh: "Quickie：急脱 → 短促激烈 → 喘息停顿" },
    { id: "arc_morning", label: "晨间慢热", en: "morning arc: sleepy kisses → slow entry → languid finish in daylight", zh: "晨间：睡意吻 → 缓慢进入 → 日光中慵懒结束" },
    { id: "arc_forced_break", label: "强制→崩溃→高潮", en: "narrative arc: forced resistance → psychological breaking → climax surrender — fictional adult CNC 21+", zh: "叙事弧：强制反抗 → 心理崩溃 → 高潮臣服——虚构成人 CNC 21+" },
    { id: "arc_train_progress", label: "调教递进", en: "training progression arc: collar intro → discipline → enforced orgasm — adults 21+", zh: "调教递进弧：项圈引入 → 惩戒 → 强制高潮——成人21+" },
    { id: "arc_gang_rounds", label: "轮奸多轮", en: "gangbang rounds arc: surround → oral round → penetration rotation → finish — adults 21+", zh: "轮奸多轮弧：围拢 → 口部轮 → 进入轮换 → 结束——成人21+" },
    { id: "arc_drug_wake", label: "迷奸·昏→半醒", en: "drug fantasy arc: drowsy limp use → half-wake struggle → dazed climax — adult fantasy 21+ only", zh: "迷奸幻想弧：昏沉软体使用 → 半醒挣扎 → 恍惚高潮——仅成人幻想21+" },
    { id: "arc_kidnap_escalate", label: "绑架升级", en: "kidnap fantasy arc: grab/van → restraint reveal → forced use — adults 21+ fiction", zh: "绑架幻想弧：抓入车 → 束缚揭示 → 强制使用——21+虚构成人" }
  ],

  /* —— 多参考槽位说明 —— */
  refSlots: [
    { id: "subject_a", label: "主体 A", role: "身份/外貌锚点 A", promptHint: "Image 1 / <Picture 1> / <Subject 1> = adult partner A identity; preserve face and body exactly" },
    { id: "subject_b", label: "主体 B", role: "身份/外貌锚点 B", promptHint: "Image 2 / <Picture 2> / <Subject 2> = adult partner B identity; preserve face and body exactly" },
    { id: "pose_ref", label: "姿势参考", role: "肢体摆位/接触关系", promptHint: "Image 3 = pose/contact reference only; transfer pose, do not transfer face identity" },
    { id: "scene_ref", label: "场景参考", role: "环境/道具/空间", promptHint: "Image 4 = environment/lighting/layout reference; keep room consistent" },
    { id: "style_ref", label: "风格参考", role: "光影/画质/色调", promptHint: "Image 5 = style/grade/texture weak_reference; do not override identities" }
  ],

  /* —— 负面提示 —— */
  negatives: {
    common: [
      "anyone under 21", "minor", "teen", "child", "loli", "shota", "age ambiguous",
      "real celebrity likeness", "real person name",
      "extra limbs", "merged bodies", "anatomy distortion", "face morphing", "identity drift",
      "sudden hard cuts", "jittery camera chaos", "low quality", "watermark", "text overlay"
    ],
    i2v: [
      "changing face identity", "wardrobe teleport", "background morph", "hand deformity", "broken contact points"
    ],
    multiref: [
      "swapping subject A and B faces", "pose-ref face leaking onto subjects", "style overriding identity", "inconsistent lighting across refs"
    ],
    qwen: [
      "blurry face", "wrong finger count", "cropped heads", "duplicate people unintended"
    ],
    h3: [
      "abrupt stepped camera", "desync audio", "frozen final seconds unnatural hold", "subject statue during camera move"
    ]
  },

  /* —— 一致性锁短语 —— */
  consistencyLocks: {
    i2v: "Preserve face identity, adult anatomy, contact points, wardrobe state, lighting direction, and background layout from the input frame. Do not re-describe appearance. Animate only reachable motion from the current pose.",
    i2v_zh: "保持首帧中的面部身份、成人体态、接触点、服装状态、光照方向与背景布局。不要重写外貌。只做从当前姿势可到达的动作。",
    multiref: "Bind identities strictly to subject reference slots. Pose reference transfers pose only. Scene reference transfers environment only. Style is weak_reference. No identity swap.",
    multiref_zh: "身份严格绑定主体参考槽。姿势参考只迁移姿势。场景参考只迁移环境。风格为弱参考。禁止身份互换。"
  }
};
