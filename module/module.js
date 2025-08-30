// Nyraldar MVP — inicialização básica
event.preventDefault();
const key = event.currentTarget.dataset.key; // chave da perícia
const per = Number(foundry.utils.getProperty(this.actor, `system.pericias.${key}`)) || 0;


// Diálogo rápido para bônus/penalidades
const content = `
<div class="nyr-dialog">
<label>${game.i18n.localize("NYR.AttrBonus")} <input type="number" name="atr" value="0"></label>
<label>${game.i18n.localize("NYR.Mod")} <input type="number" name="mod" value="0"></label>
<label>VD
<select name="vd">
<option value="normal">${game.i18n.localize("NYR.Normal")}</option>
<option value="vantagem">${game.i18n.localize("NYR.Advantage")}</option>
<option value="desvantagem">${game.i18n.localize("NYR.Disadvantage")}</option>
</select>
</label>
<label><input type="checkbox" name="luck"> ${game.i18n.localize("NYR.Luck")}</label>
</div>`;


const dlg = await Dialog.prompt({
title: `Teste: ${key}`,
content,
label: game.i18n.localize("NYR.Roll"),
callback: html => {
return {
atr: Number(html.querySelector("input[name=atr]")?.value || 0),
mod: Number(html.querySelector("input[name=mod]")?.value || 0),
vd: html.querySelector("select[name=vd]")?.value || "normal",
luck: html.querySelector("input[name=luck]")?.checked || false
};
},
rejectClose: false
});


if (!dlg) return;


const alvo = per + dlg.atr + dlg.mod;
let formula = "1d100";
if (dlg.vd === "vantagem") formula = "2d100kl1";
if (dlg.vd === "desvantagem") formula = "2d100kh1";


const rollOnce = async () => {
const r = await (new Roll(formula)).roll({async: true});
const total = r.total;
let grau = total <= Math.floor(alvo/5) ? "Sucesso Crítico" : (total <= alvo ? "Sucesso" : "Falha");
const desastre = total >= 96;


await r.toMessage({
speaker: ChatMessage.getSpeaker({actor: this.actor}),
flavor: `<b>${game.i18n.localize("NYR.Roll")}: ${key}</b> — ${game.i18n.localize("NYR.Target")}: <b>${alvo}</b><br>` +
`Resultado: <b>${total}</b> — <b>${grau}</b>${desastre ? " (Desastre 96+)" : ""}`
});
return {total, sucesso: total <= alvo};
};


let res = await rollOnce();


// Gastar Sorte para rerrolar se falhar
if (!res.sucesso && dlg.luck) {
const sortePath = "system.recursos.sorte";
const atual = Number(foundry.utils.getProperty(this.actor, sortePath)) || 0;
if (atual > 0) {
await this.actor.update({ [sortePath]: atual - 1 });
ui.notifications.info("Você gastou 1 Ponto de Sorte para rerrolar.");
res = await rollOnce();
} else {
ui.notifications.warn("Sem Pontos de Sorte.");
}
}