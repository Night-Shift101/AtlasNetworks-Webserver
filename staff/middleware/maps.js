const staffRolesOrder = [
    { id:'1324825828130951279', name:'Executive' },
    { id:'1344515873389543466', name:'Director' },
    { id:'1343749153036963900', name:'Supervisor' },
    { id:'1363744995579920434', name:'Division Leader' },
    { id:'1324825835122987120', name:'Head of Development' },
    { id:'1324825835823435818', name:'Senior Developer' },
    { id:'1324825838314590338', name:'Head Administrator' },
    { id:'1324825838910177385', name:'Senior Administrator' },
    { id:'1324825839862419567', name:'Administrator' },
    { id:'1324825840739160136', name:'Senior Moderator' },
    { id:'1324825841712103545', name:'Moderator' },
    { id:'1324825842165088393', name:'Trial Moderator' },
    { id:'1362202642847371484', name:'Staff Trainee' },
    { id:'1324825836674875492', name:'Developer' },
    { id:'1324825837354352711', name:'Trial Developer' }
  ];
  
  // Category roles definitions (in your main guild)
  const categoryRoles = [
    { id:'1355360412769456287', name:'Network Leadership' },
    { id:'1333939000486137927', name:'Server Leadership' },
    { id:'1324826998039777320', name:'Admin Department' },
    { id:'1324826996517109842', name:'Dev Team' }
  ];
  // Sub-department definitions (main guild only)
  const subDepartments = [
      {
        name: "Infrastructure",
        abbreviation: "INF",
        roles: [
          { roleId: "1358989282295025835", guildId: "1323763034488963143" },
          { roleId: "1358989281489715461", guildId: "1323763034488963143" },
          { roleId: "1358989282886549554", guildId: "1323763034488963143" }
        ]
      },
      {
        name: "Internal Affairs",
        abbreviation: "IA",
        roles: [
          { roleId: "1359658210524532917", guildId: "1323763034488963143" },
          { roleId: "1359658211787145327", guildId: "1323763034488963143" },
          { roleId: "1359016686203834548", guildId: "1323763034488963143" }
        ]
      },
      {
        name: "Gamemaster",
        abbreviation: "GM",
        roles: [
          { roleId: "1358995293030449162", guildId: "1323763034488963143" },
          { roleId: "1358989879177908365", guildId: "1323763034488963143" },
          { roleId: "1358995294154395840", guildId: "1323763034488963143" },
          { roleId: "1358989879731552326", guildId: "1323763034488963143" }
        ]
      },
      {
        name: "Recruitment",
        abbreviation: "REC",
        roles: [
          { roleId: "1358989877471084574", guildId: "1323763034488963143" },
          { roleId: "1358989283394060353", guildId: "1323763034488963143" },
          { roleId: "1358989495403548803", guildId: "1323763034488963143" }
        ]
      }
    ];
    
  // Map each staff role ID → category role ID
  const staffToCategoryRole = {
    '1324825828130951279':'1355360412769456287',
    '1344515873389543466':'1355360412769456287',
    '1343749153036963900':'1355360412769456287',
    '1363744995579920434':'1333939000486137927',
    '1324825835122987120':'1333939000486137927',
    '1324825835823435818':'1333939000486137927',
    '1324825838314590338':'1333939000486137927',
    '1324825838910177385':'1333939000486137927',
    '1324825839862419567':'1324826998039777320',
    '1324825840739160136':'1324826998039777320',
    '1324825841712103545':'1324826998039777320',
    '1324825842165088393':'1324826998039777320',
    '1362202642847371484':'1324826998039777320',
    '1324825836674875492':'1324826996517109842',
    '1324825837354352711':'1324826996517109842'
  };
  
  // Multi-guild sync mappings for Network & Server Leadership
  const multiGuildCategoryMap = {
    '1355360412769456287': [ // Network Leadership
      { guildId:'1323763034488963143', roleId:'1355360412769456287' },
      { guildId:'1329956511375687842', roleId:'1330299716147220480' },
      { guildId:'1324474489593139261', roleId:'1330299546609258557' },
      { guildId:'1324474440557531247', roleId:'1330299385657163877' },
      { guildId:'1324474193210904718', roleId:'1330299846762037248' },
      { guildId:'1324474368960626842', roleId:'1330298854871924807' },
      { guildId:'1324474317228216536', roleId:'1330299158401253446' },
      { guildId:'1324474135002484738', roleId:'1330298688391610500' },
      { guildId:'1324473700623454219', roleId:'1330010804119933028' },
      { guildId:'1324473624052109322', roleId:'1330262680916856852' }
    ],
    '1333939000486137927': [ // Server Leadership
      { guildId:'1323763034488963143', roleId:'1333939000486137927' },
      { guildId:'1324473624052109322', roleId:'1330262676793983028' },
      { guildId:'1324473700623454219', roleId:'1330010803050381312' },
      { guildId:'1324474135002484738', roleId:'1330298689134006293' },
      { guildId:'1324474193210904718', roleId:'1330299847361953865' },
      { guildId:'1324474317228216536', roleId:'1330299149492420720' },
      { guildId:'1324474368960626842', roleId:'1330298855673036800' },
      { guildId:'1324474440557531247', roleId:'1330299386957271101' },
      { guildId:'1324474489593139261', roleId:'1330299547389526197' },
      { guildId:'1329956511375687842', roleId:'1330299717221093466' }
    ]
  };

module.exports = {
  staffRolesOrder,
  categoryRoles,
  subDepartments,
  staffToCategoryRole,
  multiGuildCategoryMap,
};
