// All gameplay numbers live here. See docs/FIDELITY.md for provenance.
// Cost, supply, HP, armor, light/armored damage, attack interval, speed.
export const FACTIONS=Object.freeze([
  {id:'roland',name:'罗兰王国',ruler:'伊莲娜女王',leaderPortrait:'assets/leaders/roland.jpg',colors:'正红 · 金黄',emblem:'金色雄狮与破损王冠',mascot:'赤鬃狮',baseName:'王都石堡',castleStyle:'roland',stone:'#3d3035',stoneLight:'#84636a',shadow:'#620e24',accent:'#ffd12a',glow:'#ff355b',banner:'#d41432',description:'旧帝国正统继承者，以王冠与骑士荣光夺回母晶。'},
  {id:'azure',name:'蓝海共和国',ruler:'凯恩首席执政官',leaderPortrait:'assets/leaders/azure.jpg',colors:'宝蓝 · 银白',emblem:'白帆与海浪',mascot:'海鹰',baseName:'海港灯塔',castleStyle:'azure',stone:'#2d4655',stoneLight:'#7895a4',shadow:'#062d61',accent:'#f7fbff',glow:'#22d3ee',banner:'#0057d9',description:'沿海城邦与商人议会，以舰队和自由守住海上母晶。'},
  {id:'north',name:'北境部落联盟',ruler:'洛莎大酋长',leaderPortrait:'assets/leaders/north.jpg',colors:'翠绿 · 冰白',emblem:'白鹿角与树种',mascot:'白鹿',baseName:'北境祖屋',castleStyle:'north',stone:'#344438',stoneLight:'#89986f',shadow:'#093e2a',accent:'#f1fff7',glow:'#2edbff',banner:'#008f4c',description:'森林与草原部落的盟誓，守护古老母晶和北境家园。'},
  {id:'blackstone',name:'黑石公国',ruler:'奥兰大公',leaderPortrait:'assets/leaders/blackstone.jpg',colors:'熔岩橙 · 铁黑',emblem:'黑山与铁锤',mascot:'黑岩羊',baseName:'熔岩锻炉',castleStyle:'blackstone',stone:'#2b2d31',stoneLight:'#63666a',shadow:'#34170e',accent:'#ffc21c',glow:'#ff4b16',banner:'#e85000',description:'山地矿区与兵工厂锻造的重甲公国，背负洗清家族罪名的誓言。'},
  {id:'silvermoon',name:'银月遗民',ruler:'弥纱 · 盲眼先知',leaderPortrait:'assets/leaders/silvermoon.jpg',colors:'辉紫 · 月银',emblem:'被裂痕贯穿的银色弯月',mascot:'渡鸦',baseName:'银月神殿',castleStyle:'silvermoon',stone:'#3d394b',stoneLight:'#85839b',shadow:'#291050',accent:'#f5eeff',glow:'#c47dff',banner:'#6a20d0',description:'被晶尘改变的流亡者，在废墟与荒原寻找不会驱逐他们的地方。'},
  {id:'mistsea',name:'雾海王国',ruler:'未知 · 传说中的雾王',leaderPortrait:'assets/leaders/mistsea.jpg',colors:'深海蓝 · 纯白',emblem:'三重浓雾包围白塔',mascot:'雪鸮',baseName:'雾海白塔',castleStyle:'mistsea',stone:'#617480',stoneLight:'#d5e3e5',shadow:'#003041',accent:'#ffffff',glow:'#3be1ff',banner:'#00739c',description:'被永恒浓雾包围的神秘王国，白塔钟声无人能解释。'}
]);
export const FACTION_BY_ID=Object.freeze(Object.fromEntries(FACTIONS.map(f=>[f.id,f])));
export const FACTION_RELATIONS=Object.freeze({
  'azure|blackstone':{title:'军火与海运的冷交易',story:'蓝海商船运走黑石的矿锭，黑石锻炉回赠护航炮材；双方互相需要，也都担心对方坐大。'},
  'azure|mistsea':{title:'雾中的旧航线',story:'蓝海的航海图把雾海白塔标成禁区，但每一代执政官都在暗中寻找那条失踪的补给航线。'},
  'azure|north':{title:'盐路与鹿道',story:'蓝海以盐和铁换取北境皮毛，北境则要求共和国尊重古老鹿道；商队常在边界谈判数月。'},
  'azure|roland':{title:'王室借贷与海上盟约',story:'罗兰用矿权换取蓝海舰队保护王都航线，两国的盟约稳固，却始终绕不开旧债和港口税。'},
  'azure|silvermoon':{title:'被封存的月港',story:'银月遗民曾把一座废港交给蓝海管理，晶尘扩散后港口被封锁，双方都认为对方隐瞒了真相。'},
  'blackstone|mistsea':{title:'熔炉与白塔的回声',story:'黑石的矿工在雾海海岸发现过同样的晶体纹路；大公想要矿脉，雾王只允许他们带走一块样本。'},
  'blackstone|north':{title:'山火边界',story:'黑石向北境索取铁矿通道，北境拒绝让伐木队越过盟誓石；两边的边界哨所至今保持最高戒备。'},
  'blackstone|roland':{title:'破冠与铁锤',story:'罗兰王室曾雇佣黑石军团平息叛乱，后来却拒绝承认军费欠款；奥兰大公把这笔债记在王冠上。'},
  'blackstone|silvermoon':{title:'晶尘锻造禁忌',story:'银月遗民认为黑石炉火会唤醒晶尘，黑石则相信银月掌握着失传的淬炼方法；双方都在寻找对方的工坊。'},
  'mistsea|north':{title:'白塔与古鹿道',story:'北境的传说说，雾海白塔曾为迷路的鹿群点灯；如今灯塔仍亮着，但没有人知道是谁在添灯油。'},
  'mistsea|roland':{title:'失踪王冠的传闻',story:'罗兰王室档案记载，第一代王冠曾在雾海失踪；雾王从不承认见过它，只说海雾记得每一位来客。'},
  'mistsea|silvermoon':{title:'两种月光',story:'银月先知把雾海视为晶尘的源头，雾王却称银月是被海潮遗弃的镜子；他们彼此理解，也彼此提防。'},
  'north|roland':{title:'王冠与盟誓石',story:'罗兰希望把北境纳入王国版图，北境只承认并肩作战的盟友；双方的边界由一块古老盟誓石划定。'},
  'north|silvermoon':{title:'白鹿不走废墟',story:'北境部落相信白鹿会避开银月遗民留下的晶尘，银月则认为那是偏见；两方都在寻找能证明自己正确的古老记录。'},
  'roland|silvermoon':{title:'旧帝国的遗民争端',story:'罗兰把银月视为失落的旧帝国同胞，银月遗民却拒绝回到王冠之下；他们共享历史，也共享无法愈合的裂痕。'}
});

const baseRows = [
  ['newbie','民兵','Militia',20,1,65,0,0,14,10,.83,2.8,'低价集结 · 枪阵反击'],
  ['zombie','僵尸','Zombie',35,2,180,1,2,16,8,1.5,1.55,'重甲前排 · 耐久防线'],
  ['samurai','弓箭手','Archer',100,3,70,0,0,18,34,1.9,1.4,'前期远程 · 单体箭矢'],
  ['swordsman','剑兵','Sword Man',40,2,160,1,3,16,9,1.4,2,'盾阵步兵 · 稳固防线'],
  ['ninja','忍者','Ninja',100,2,90,0,0,24,4,0.82,3.3,'快速连击 · 脆身突袭'],
  ['heavy','重甲长矛兵','Heavy Spearman',450,5,400,1,6,25,12,1.6,1.65,'重甲壁垒 · 长矛拒止 · 掩护后排'],
  ['monk','武僧','Monk',400,4,320,0,3,26,7,1.2,3,'轻装耐战 · 贴身缠斗'],
  ['vampire','吸血鬼','Vampire',600,5,280,1,2,36,14,1.1,1.8,'重甲吸血 · 持续决斗'],
  ['cavalry','骑兵','Cavalry',650,6,330,0,1,75,10,1.6,4.3,'高速重击 · 快速支援'],
  ['mage','法师','Mage',800,6,150,0,0,22,55,1.8,1.45,'远程范围 · 压制重甲'],
  ['strange','奇异博士','Doctor Strange',1500,6,360,0,1,52,260,1.9,1.5,'悬浮秘术 · 高额单体破甲 · 脆弱后排'],
  ['dread','猩红裁决者','Crimson Arbiter',1500,6,860,1,5,80,40,1.3,2.05,'黑曜重甲 · 猩红光刃 · 旋斩破阵'],
  ['high','至高领主','High Lord',1800,7,1200,1,4,155,90,1.59,2.2,'终极剑士 · 决胜战场']
];
// The mysterious unit is intentionally a fixed 1000-gold gamble. Its rolled
// unit changes each time, but the contract price stays easy to understand.
export const MYSTERY_COST = 1000;
const rows = [...baseRows,
  ['mystery','神秘兵种','Enigma',MYSTERY_COST,4,260,1,2,42,48,1.12,2.9,'未知战术 · 灵活补位']
];

// Artwork identifiers are stable; removing a unit must not change another one's model.
const roles={
  newbie:{visual:0,stage:'前期',role:'数量补位',strength:'低成本集结、枪阵反击、追击落单远程',weakness:'范围伤害、持续承压',counters:['zombie'],counteredBy:['samurai','dread'],trait:'20金币、1补给；对重甲有基础反击力，靠数量而非单兵硬拼'},
  zombie:{visual:2,stage:'前期',role:'恢复肉盾',strength:'拖住轻甲、脱战恢复',weakness:'法师、奇异博士',counters:['newbie','ninja'],counteredBy:['mage','strange'],regen:3,trait:'脱战3秒后，每秒恢复3生命；行军缓慢'},
  samurai:{visual:3,stage:'前期',role:'后排弓手',strength:'压制重甲、持续远程输出',weakness:'忍者和骑兵贴身、范围伤害',counters:['zombie','swordsman','heavy'],counteredBy:['ninja','cavalry','dread'],trait:'射程135、无范围伤害；保持在近战线后，贴身时边攻击边拉距'},
  swordsman:{visual:4,stage:'前期',role:'盾阵步兵',strength:'承受轻甲攻击、掩护后排',weakness:'法师、奇异博士',counters:['newbie','ninja'],counteredBy:['mage','strange'],trait:'160生命、3护甲；以较低输出换取稳定承伤'},
  ninja:{visual:5,stage:'中前期',role:'闪现突袭',strength:'闪现切入弓箭手、追击远程',weakness:'重甲前排、范围伤害',counters:['mage','strange','samurai'],counteredBy:['heavy','dread'],blinkRange:420,blinkCooldown:4.5,trait:'锁定弓箭手后可在420范围内闪现切入；4.5秒冷却，只有90生命，不能硬拼重甲'},
  heavy:{visual:7,stage:'中前期',role:'重甲壁垒',strength:'抵挡轻甲轻击、保护远程',weakness:'法师、奇异博士',counters:['newbie','ninja','monk'],counteredBy:['mage','strange'],trait:'400生命、6护甲；机动慢，需队友补足输出'},
  monk:{visual:8,stage:'中前期',role:'轻装耐战',strength:'贴身缠住远程、承受小额伤害',weakness:'重甲步兵、重装领主',counters:['mage','strange','samurai'],counteredBy:['heavy','dread'],trait:'320生命、3护甲的轻甲近战；不再具备破甲专长'},
  vampire:{visual:9,stage:'中后期',role:'吸血决斗',strength:'持续攻击轻甲时恢复生命',weakness:'远程破甲、集中爆发',counters:['newbie','ninja','monk'],counteredBy:['mage','strange'],lifesteal:.3,trait:'攻击士兵时恢复实际伤害的30%；无法靠攻击建筑吸血'},
  cavalry:{visual:10,stage:'中后期',role:'高速重击',strength:'快速支援、贴身重击远程',weakness:'重甲、低价群兵包围',counters:['mage','strange','samurai'],counteredBy:['swordsman','heavy','dread'],trait:'4.3移速全军最快；每1.6秒重击，单次对轻甲75伤害'},
  mage:{visual:12,stage:'中后期',role:'后排范围',strength:'重甲集群',weakness:'忍者、骑兵贴身',counters:['zombie','swordsman','heavy','vampire'],counteredBy:['ninja','cavalry'],splashRadius:55,splashFactor:.5,trait:'位于近战线后施法；命中目标周围 55 范围的敌兵受到 50% 伤害'},
  strange:{visual:16,stage:'后期',role:'远程单体破甲',strength:'重装领主、单个高价值重甲',weakness:'轻甲贴身、密集群兵',counters:['dread','high','heavy'],counteredBy:['ninja','cavalry','monk'],trait:'悬浮于近战线后，射程240、单次对重甲260伤害；后撤时仍可施法'},
  dread:{visual:14,stage:'后期',role:'光刃破阵',strength:'三式光刃剑技压制密集轻甲',weakness:'奇异博士、至高领主',counters:['newbie','ninja','cavalry'],counteredBy:['strange','high'],splashRadius:42,splashFactor:.6,trait:'突刺、交叉斜斩、蓄力回旋斩随机轮换；目标周围 42 范围的敌兵受到 60% 伤害'},
  high:{visual:15,stage:'后期',role:'单体决战',strength:'轻甲精锐、持续单体输出',weakness:'奇异博士、法师集火',counters:['ninja','cavalry','monk'],counteredBy:['strange','mage'],trait:'1200生命、单次对轻甲155伤害；无范围伤害，需保护免受远程集火'},
  mystery:{visual:17,stage:'特殊',role:'随机召唤',strength:'随机获得任意实际兵种',weakness:'结果不可控',counters:[],counteredBy:[],trait:'每次招募从其他 13 种兵种中随机抽取一个'}
};

export const UNITS = rows.map((r, index) => {
  const [id,name,en,cost,supply,hp,armored,armor,lightDamage,heavyDamage,interval,speed,description] = r;
  return Object.freeze({ index,id,name,en,cost,supply,income:supply*4,hp,armored:Boolean(armored),armor,lightDamage,heavyDamage,interval,speed,description,
    range:id==='strange'?240:id==='mage'?170:id==='samurai'?135:18,
    radius:id==='cavalry'?13:['heavy','dread','high'].includes(id)?12:8,
    combatClass:id==='mystery'?'特殊':['mage','strange','samurai'].includes(id)?'远程':armored?'重甲':'轻甲',
    verified:['newbie','high'].includes(id),...roles[id]
  });
});
export const UNIT_BY_ID=Object.freeze(Object.fromEntries(UNITS.map(d=>[d.id,d])));
export const ROSTER_COLUMNS=7;

export const RULES = Object.freeze({
  width:6200, height:500, step:1/30, roundSeconds:20, startGold:400, startIncome:200,
  baseIncomeGrowth:50, baseIncomeCap:4000, incomePerSupply:4, armyIncomeRatio:.5, maxIncome:4000,
  roundSupply:30, spawnInterval:.2, castleHP:6000, castleArmor:18, castleRange:260, castleDamage:230,
  castleInterval:1, campHP:700, campArmor:3, campRange:180, campDamage:28, campInterval:1.5,
  bombardCost:2000, bombardCooldown:80, bombardWidth:1100, bombardHeight:500, bombardEffectDuration:7, bombardMissiles:24, bombardFlight:1.8, bombardStagger:.22, bombardDamageInterval:1, bombardDamageWaves:5, bombardFriendlyFire:.12,
  nukeCosts:Object.freeze([500,18888,28888]), nukeMaxUses:3, nukeFlight:5, nukeBlastDuration:10,
  nukePollutionRounds:5, nukePollutionRadiusX:480, nukePollutionRadiusY:235, nukePollutionDps:.6,
  // Forward walls automatically release a light three-volley arrow barrage
  // when a dense push reaches the gate. The long cooldown keeps it defensive
  // rather than turning the wall into a second artillery battery.
  campBarrageRange:300, campBarrageDamage:8, campBarrageWaves:3, campBarrageInterval:.5,
  campBarrageCooldown:100, campBarrageMinTargets:4, campBarrageCriticalHpRatio:.5,
  campBarrageEffectDuration:1.8, corpseSeconds:2,
  // Legacy aliases keep older balance scripts readable while the game now uses castle terminology.
  crystalHP:6000, crystalRange:260, crystalDamage:230, crystalInterval:1, speedScale:36, unitCap:30
});
export const RANGED_TACTICS=Object.freeze({
  safeRatio:.78, preferredRatio:.9, positionTolerance:5, frontlineGap:58
});
export const DIFFICULTIES = [
  {id:'easy',name:'简单',subtitle:'熟悉战场',reaction:8,skill:.2},
  {id:'normal',name:'普通',subtitle:'势均力敌',reaction:4,skill:.55},
  {id:'hard',name:'困难',subtitle:'兵种博弈',reaction:2,skill:.85},
  {id:'abyss',name:'深渊',subtitle:'极限挑战',reaction:.8,skill:1}
];
