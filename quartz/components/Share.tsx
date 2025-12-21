import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

export default (() => {
  const Share: QuartzComponent = ({ displayClass, cfg, fileData }: QuartzComponentProps) => {
    const url = `https://${cfg.baseUrl}/${fileData.slug}`
    
    // 1. СЛОВАРЬ ПЕРЕВОДОВ
    const translations: Record<string, { btn: string, copied: string }> = {
      "ru": { btn: "Копировать", copied: "Скопировано!" },
      "en": { btn: "Copy Link",   copied: "Copied!" },
      "de": { btn: "Kopieren",    copied: "Kopiert!" },
      "fr": { btn: "Copier",      copied: "Copié!" },
      "es": { btn: "Copiar",      copied: "¡Copiado!" },
      "pt": { btn: "Copiar",      copied: "Copiado!" },
      "zh": { btn: "复制",        copied: "已复制!" }
    }

    // 2. ОПРЕДЕЛЕНИЕ ЯЗЫКА
    // Берем язык из свойств файла или дефолтный en
    const lang = (fileData.frontmatter?.lang as string) || "en"
    const t = translations[lang] || translations["en"]

    return (
      <div class={classNames(displayClass, "share-component")}>
        <button 
          class="share-button" 
          data-url={url} 
          data-copied-text={t.copied}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span class="share-text">{t.btn}</span>
        </button>
      </div>
    )
  }

  // СТИЛИ
  Share.css = `
  .share-component {
    margin-top: 1rem;
    margin-bottom: 1rem;
  }
  .share-button {
    display: flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: 1px solid var(--lightgray);
    color: var(--gray);
    padding: 6px 12px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.9rem;
    font-family: inherit;
    transition: all 0.2s ease;
  }
  .share-button:hover {
    border-color: var(--secondary);
    color: var(--secondary);
    background: var(--light);
  }
  .share-button svg {
    width: 16px;
    height: 16px;
  }
  `

  // ЛОГИКА (ТОЛЬКО КОПИРОВАНИЕ)
  Share.afterDOMLoaded = `
  document.addEventListener("nav", () => {
    const btns = document.querySelectorAll(".share-button");
    
    btns.forEach(btn => {
      // Клонируем кнопку, чтобы убрать старые обработчики событий
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      newBtn.addEventListener("click", async () => {
        const url = newBtn.getAttribute("data-url");
        const copiedText = newBtn.getAttribute("data-copied-text"); // Берем переведенный текст
        const textSpan = newBtn.querySelector(".share-text");
        const originalText = textSpan.innerText;

        try {
          // ВСЕГДА используем буфер обмена, игнорируем navigator.share
          await navigator.clipboard.writeText(url);
          
          // Анимация текста
          textSpan.innerText = copiedText;
          newBtn.style.borderColor = "var(--tertiary)";
          newBtn.style.color = "var(--tertiary)";
          
          setTimeout(() => {
            textSpan.innerText = originalText;
            newBtn.style.borderColor = "";
            newBtn.style.color = "";
          }, 2000);
          
        } catch (err) {
          console.error("Copy failed:", err);
        }
      });
    });
  });
  `

  return Share
}) satisfies QuartzComponentConstructor