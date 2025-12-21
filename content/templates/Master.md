<%*
// ============================================================
// 1. КОНФИГУРАЦИЯ
// ============================================================

// --- ЯЗЫКИ ООН (UN Official) + Крупные рынки ---
const ALL_LANGS = {
    "ru": { flag: "🇷🇺", name: "Русский", target: "Russian" },     // UN
    "en": { flag: "🇺🇸", name: "English", target: "English" },     // UN
    "zh": { flag: "🇨🇳", name: "中文", target: "Chinese" },        // UN
    "es": { flag: "🇪🇸", name: "Español", target: "Spanish" },     // UN
    "ar": { flag: "🇸🇦", name: "العربية", target: "Arabic" },      // UN
    "fr": { flag: "🇫🇷", name: "Français", target: "French" },     // UN
    // Дополнительные (можно удалить)
    "de": { flag: "🇩🇪", name: "Deutsch", target: "German" },
    "pt": { flag: "🇧🇷", name: "Português", target: "Portuguese" }
};

const MY_LINKS = {
    telegram: "https://t.me/hyrahmo",
    github: "https://github.com/hyrahmo",
    email: "contact@hyrahmo.com",
    habr: "https://habr.com/users/hyrahmo",
    twitter: "https://twitter.com/hyrahmo",
    linkedin: "https://linkedin.com/in/hyrahmo",
    youtube: "https://youtube.com/@hyrahmo"
};

const title = tp.file.title;
const date = tp.date.now("YYYY-MM-DD");
let currentFolder = tp.file.folder(true);

// ============================================================
// 2. ОПРЕДЕЛЕНИЕ ТЕКУЩЕГО ЯЗЫКА
// ============================================================
let currentLang = "en"; 
let pathParts = currentFolder.split("/");
if (pathParts.length > 0 && ALL_LANGS[pathParts[0]]) {
    currentLang = pathParts[0];
}

function getPathForLang(folder, code) {
    let parts = folder.split("/");
    if (ALL_LANGS[parts[0]]) {
        parts[0] = code;
        return parts.join("/");
    }
    return code + "/" + folder;
}

// ============================================================
// 3. ГЕНЕРАЦИЯ БЛОКОВ
// ============================================================

// 3.1 Языковая панель (Красивая)
let langLinks = [];
for (let code in ALL_LANGS) {
    if (code === currentLang) continue;
    const targetPath = getPathForLang(currentFolder, code);
    const linkPath = targetPath + "/" + title;
    // Используем пробелы для читаемости
    langLinks.push(ALL_LANGS[code].flag + " **[[" + linkPath + "|" + ALL_LANGS[code].name + "]]**");
}
// Добавляем RSS
const rssLink = "📡 **[RSS](index.xml)**";
const langCallout = "> [!note] 🌍 Translations\n> " + langLinks.join(" • ") + " • " + rssLink;

// 3.2 Подвал
let footerContent = "";
if (currentLang === "ru") {
    footerContent = "> [!abstract] 📬 Контакты\n> - **Telegram**: [ @hyrahmo ](" + MY_LINKS.telegram + ")\n> - **GitHub**: [ hyrahmo ](" + MY_LINKS.github + ")\n> - **Habr**: [ Профиль ](" + MY_LINKS.habr + ")\n> - **Email**: [ Написать ](mailto:" + MY_LINKS.email + ")";
} else {
    footerContent = "> [!abstract] 📬 Connect\n> - **X (Twitter)**: [ @hyrahmo ](" + MY_LINKS.twitter + ")\n> - **GitHub**: [ hyrahmo ](" + MY_LINKS.github + ")\n> - **LinkedIn**: [ Profile ](" + MY_LINKS.linkedin + ")\n> - **Email**: [ Contact ](mailto:" + MY_LINKS.email + ")";
}

// 3.3 Frontmatter (С МУЛЬТИ-КАНОНИКАЛ)
const frontmatter = "---\n" +
    "title: \"" + title + "\"\n" +
    "date: " + date + "\n" +
    "lastmod: " + date + "\n" +
    "lang: \"" + currentLang + "\"\n" +
    "description: \"Description for " + title + "\"\n" +
    "tags: [" + currentLang + ", topic]\n" +
    "# canonicalUrl: \n" +
    "#  - \"https://original-source.com\"\n" +
    "#  - \"https://another-source.com\"\n" +
    "aliases: []\n" +
    "draft: false\n" +
    "enableToc: true\n" +
    "comments: true\n" +
    "---\n";

// ============================================================
// 4. ВСТАВКА В ФАЙЛ
// ============================================================
const file = tp.file.find_tfile(tp.file.path(true));
let content = await app.vault.read(file);

if (content.length < 10 || !content.startsWith("---")) {
    tR += frontmatter + "\n";
    tR += langCallout + "\n\n---\n\n";
    tR += "# " + title + "\n\n";
    tR += tp.file.cursor(); 
    tR += "\n\n---\n\n" + footerContent;
} else {
    // Ремонт существующего файла
    if (!content.includes("lastmod:")) {
        content = content.replace(/^---[\s\S]*?---/, "");
        if (content.startsWith("\n")) content = content.substring(1);
        content = frontmatter + "\n" + content;
    }
    content = content.replace(/> \[!note\].*?(\n> .*?)*(\n|$)/g, ""); 
    const fmEnd = content.indexOf("---", 3);
    if (fmEnd !== -1) {
        content = content.slice(0, fmEnd + 3) + "\n\n" + langCallout + "\n\n---\n" + content.slice(fmEnd + 3).trim();
    }
    if (!content.includes("📬")) {
        content = content + "\n\n---\n\n" + footerContent;
    }
    await app.vault.modify(file, content);
}
%>
<%*
// ============================================================
// 5. АВТО-СОЗДАНИЕ ДУБЛИКАТОВ
// ============================================================
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (let code in ALL_LANGS) {
    if (code === currentLang) continue;

    const targetFolder = getPathForLang(currentFolder, code);
    const targetPath = targetFolder + "/" + title + ".md";
    const targetFile = app.vault.getAbstractFileByPath(targetPath);

    if (!targetFile) {
        try {
            const folders = targetFolder.split("/"); 
            let buildPath = "";
            for (let i = 0; i < folders.length; i++) {
                if (!folders[i]) continue;
                buildPath += folders[i];
                if (!(await app.vault.adapter.exists(buildPath))) {
                    await app.vault.createFolder(buildPath);
                }
                buildPath += "/";
            }

            let siblingLinks = [];
            for (let c in ALL_LANGS) {
                if (c === code) continue;
                // Путь от близнеца
                let siblingPathParts = targetFolder.split("/");
                siblingPathParts[0] = c;
                const linkP = siblingPathParts.join("/") + "/" + title;
                siblingLinks.push(ALL_LANGS[c].flag + " **[[" + linkP + "|" + ALL_LANGS[c].name + "]]**");
            }
            const siblingCallout = "> [!note] 🌍 Translations\n> " + siblingLinks.join(" • ") + " • " + rssLink;

            let siblingFooter = (code === "ru") ? 
                 "> [!abstract] 📬 Контакты\n> - **Telegram**: [ @hyrahmo ](" + MY_LINKS.telegram + ")" :
                 "> [!abstract] 📬 Connect\n> - **X (Twitter)**: [ @hyrahmo ](" + MY_LINKS.twitter + ")";

            const siblingBody = "<!-- TRANSLATE_START -->\n*(Content to be translated to " + ALL_LANGS[code].target + ")...*\n<!-- TRANSLATE_END -->";

            const siblingContent = "---\n" +
                "title: \"" + title + "\"\n" +
                "date: " + date + "\n" +
                "lastmod: " + date + "\n" +
                "lang: \"" + code + "\"\n" +
                "description: \"Translation stub for " + title + "\"\n" +
                "tags: [" + code + ", stub]\n" +
                "# canonicalUrl:\n" +
                "#  - \"\"\n" +
                "draft: false\n" +
                "enableToc: true\n" +
                "comments: true\n" +
                "---\n\n" +
                siblingCallout + "\n\n---\n\n" +
                siblingBody + "\n\n---\n\n" +
                siblingFooter + "\n";

            await tp.file.create_new(siblingContent, title, false, targetFolder);
            new Notice("✅ Created: " + code.toUpperCase());
            
            await sleep(50); 
        } catch(e) { console.error(e); }
    }
}
%>