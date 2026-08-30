export const sharePointConfig = {
  hostname: "bbschadstoffsanierung-my.sharepoint.com",
  sitePath: "/personal/l_b_bb-schadstoffsanierung_ch",

  rootFolder: "Baustellen",

  folders: {
    auftrag: "01_Auftrag",
    checklisten: "02_Checklisten",
    fotos: "03_Fotos",
    plaene: "04_Plaene",
    messungen: "05_Messungen",
    entsorgung: "06_Entsorgung",
    abschluss: "07_Abschluss",
  },
};

export function baustellenOrdner(
  nummer: string,
  projektname: string
) {
  const clean = projektname
    .replace(/[<>:"/\\|?*]/g, "")
    .replace(/\s+/g, "_");

  return `${sharePointConfig.rootFolder}/${nummer}_${clean}`;
}
