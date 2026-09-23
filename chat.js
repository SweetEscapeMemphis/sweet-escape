(function () {
  if (window.__sweetEscapeChatLoaded) return;
  window.__sweetEscapeChatLoaded = true;

  const ROOT_PATH = document.currentScript?.src
    ? new URL(".", document.currentScript.src).pathname
    : "/";
  const STORE = {
    address: "1674 Whitten Rd, Suite 106, Memphis, TN 38134",
    phoneLabel: "(901) 718-5812",
    phoneHref: "tel:+19017185812",
    directions: "https://share.google/4KF1GDH3zOARV0nm1",
    hours: "Monday–Thursday: 12–9 PM. Friday–Sunday: 12–10 PM.",
  };
  const GROUPS = [
    { key: "scoops", catalog: "SWEET_ESCAPE_FLAVORS", path: "scoops", label: "scoop" },
    { key: "yogurt", catalog: "SWEET_ESCAPE_YOGURT_FLAVORS", path: "yogurt", label: "yogurt" },
    { key: "gelato", catalog: "SWEET_ESCAPE_GELATO_FLAVORS", path: "gelato", label: "gelato" },
  ];
  const catalogScripts = {
    SWEET_ESCAPE_FLAVORS: "data/flavors.js?v=20260905-1",
    SWEET_ESCAPE_YOGURT_FLAVORS: "data/yogurt-flavors.js?v=20260827-3",
    SWEET_ESCAPE_GELATO_FLAVORS: "data/gelato-flavors.js?v=20260827-3",
  };
  let catalogPromise;
  let stockPromise;
  let lastFocusedElement = null;

  const root = element("aside", "sweet-chat");
  root.setAttribute("aria-label", "Sweet Escape helper");
  if (document.querySelector(".mobile-action-bar")) root.classList.add("has-mobile-action-bar");

  const panel = element("section", "sweet-chat-panel");
  panel.id = "sweet-chat-panel";
  panel.hidden = true;
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "false");
  panel.setAttribute("aria-labelledby", "sweet-chat-title");

  const header = element("header", "sweet-chat-header");
  const avatar = element("span", "sweet-chat-avatar", "🍦");
  avatar.setAttribute("aria-hidden", "true");
  const heading = element("div", "sweet-chat-heading");
  const title = element("strong", "", "Sweet Escape helper");
  title.id = "sweet-chat-title";
  heading.append(title, element("span", "", "Menu, hours & store details"));
  const close = element("button", "sweet-chat-close", "×");
  close.type = "button";
  close.setAttribute("aria-label", "Close chat");
  header.append(avatar, heading, close);

  const messages = element("div", "sweet-chat-messages");
  messages.setAttribute("role", "log");
  messages.setAttribute("aria-live", "polite");
  messages.setAttribute("aria-relevant", "additions");

  const chips = element("div", "sweet-chat-chips");
  const quickQuestions = ["What’s in stock?", "Store hours", "Directions", "Allergy info"];
  quickQuestions.forEach((question) => {
    const chip = element("button", "sweet-chat-chip", question);
    chip.type = "button";
    chip.addEventListener("click", () => submitQuestion(question));
    chips.append(chip);
  });

  const form = element("form", "sweet-chat-form");
  const input = element("input", "sweet-chat-input");
  input.type = "text";
  input.name = "question";
  input.maxLength = 180;
  input.autocomplete = "off";
  input.placeholder = "Ask about flavors or your visit";
  input.setAttribute("aria-label", "Ask Sweet Escape a question");
  const send = element("button", "sweet-chat-send", "Send");
  send.type = "submit";
  form.append(input, send);

  const note = element("p", "sweet-chat-note", "For allergy safety, confirm the current container label with our team.");

  const launcher = element("button", "sweet-chat-launcher");
  launcher.type = "button";
  launcher.setAttribute("aria-controls", panel.id);
  launcher.setAttribute("aria-expanded", "false");
  const launcherMark = element("span", "sweet-chat-mark", "🍨");
  launcherMark.setAttribute("aria-hidden", "true");
  launcher.append(launcherMark, element("span", "", "Ask Sweet Escape"));

  panel.append(header, messages, chips, form, note);
  root.append(panel, launcher);
  document.body.append(root);

  addBotMessage([
    textPart("Hi! I can help with today’s menu, flavors, hours, directions, and store details."),
  ]);

  launcher.addEventListener("click", () => setOpen(panel.hidden));
  close.addEventListener("click", () => setOpen(false));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitQuestion(input.value);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) setOpen(false);
  });

  if (new URLSearchParams(window.location.search).get("chat") === "open") setOpen(true);

  function setOpen(open) {
    panel.hidden = !open;
    launcher.setAttribute("aria-expanded", String(open));
    if (open) {
      lastFocusedElement = document.activeElement;
      window.requestAnimationFrame(() => input.focus());
      track("chat_open");
    } else {
      const target = lastFocusedElement instanceof HTMLElement ? lastFocusedElement : launcher;
      target.focus();
    }
  }

  async function submitQuestion(rawQuestion) {
    const question = rawQuestion.trim().replace(/\s+/g, " ");
    if (!question) return;
    input.value = "";
    addUserMessage(question);
    send.disabled = true;
    input.disabled = true;

    const response = await answerQuestion(question).catch(() => fallbackAnswer());
    addBotMessage(response);
    send.disabled = false;
    input.disabled = false;
    input.focus();
    track("chat_question", { question_topic: classifyQuestion(question) });
  }

  async function answerQuestion(question) {
    const normalized = normalize(question);

    if (matches(normalized, ["hour", "open", "close", "closing", "time"])) {
      return [textPart(STORE.hours), linkPart("Plan your visit", "visit.html")];
    }

    if (matches(normalized, ["where", "address", "location", "direction", "map", "get there"])) {
      return [textPart(`We’re at ${STORE.address}.`), linkPart("Open directions", STORE.directions, true)];
    }

    if (matches(normalized, ["phone", "call", "contact", "number"])) {
      return [textPart(`Call us at ${STORE.phoneLabel}.`), linkPart("Call Sweet Escape", STORE.phoneHref)];
    }

    if (
      matches(normalized, ["allerg", "ingredient", "gluten", "peanut", "nut", "egg", "soy"]) ||
      /\b(?:milk|dairy)\b/.test(normalized)
    ) {
      return [
        textPart("Recipes and labels can change. Check the published nutrition details, then ask our team to verify the current container label before ordering."),
        linkPart("Browse nutrition & allergens", "flavors.html#nutrition"),
        linkPart("Call the shop", STORE.phoneHref),
      ];
    }

    if (matches(normalized, ["price", "cost", "how much", "pricing"])) {
      return [
        textPart("For current pricing, please call the shop—this helper won’t guess at prices."),
        linkPart(`Call ${STORE.phoneLabel}`, STORE.phoneHref),
      ];
    }

    if (matches(normalized, ["reward", "loyalty", "points", "free scoop"])) {
      return [textPart("You can see how Sweet Escape Rewards works on our rewards page."), linkPart("View rewards", "rewards.html")];
    }

    if (matches(normalized, ["special", "cookie", "brownie", "nacho", "dubai", "milkshake"])) {
      const flavorResult = await flavorAnswer(question);
      if (flavorResult) return flavorResult;
      return [textPart("Browse our loaded treats, warm bases, ice cream nachos, shakes, and other specialties."), linkPart("See specialties", "specialties.html")];
    }

    if (matches(normalized, ["stock", "menu", "flavor", "ice cream", "yogurt", "gelato", "sorbet", "vegan", "recommend", "have", "available"])) {
      return (await flavorAnswer(question)) || (await stockSummary());
    }

    const flavorResult = await flavorAnswer(question);
    return flavorResult || fallbackAnswer();
  }

  async function stockSummary() {
    const { stock, catalogs } = await loadStoreData();
    const counts = GROUPS.map((group) => {
      const all = catalogs[group.catalog]?.flavors || [];
      return availableIds(stock, group.key, all).size;
    });
    const total = counts.reduce((sum, count) => sum + count, 0);
    return [
      textPart(`Today’s published menu lists ${total} treats: ${counts[0]} scoop flavors, ${counts[1]} frozen yogurt choices, and ${counts[2]} gelato or sorbetto choices.`),
      linkPart("See the live menu", "stock.html"),
    ];
  }

  async function flavorAnswer(question) {
    const { stock, catalogs } = await loadStoreData();
    const words = meaningfulWords(question);
    const dietaryQuery = matches(normalize(question), ["vegan", "dairy free", "dairy-free", "sorbet", "sorbetto", "no sugar", "sugar free"]);
    const matchesByScore = [];

    GROUPS.forEach((group) => {
      const flavors = catalogs[group.catalog]?.flavors || [];
      const inStock = availableIds(stock, group.key, flavors);
      flavors.forEach((flavor) => {
        if (!inStock.has(flavor.id)) return;
        const haystack = normalize([
          flavor.name,
          flavor.category,
          flavor.description,
          JSON.stringify(flavor.allergens || ""),
        ].filter(Boolean).join(" "));
        let score = words.reduce((sum, word) => sum + (haystack.includes(word) ? 1 : 0), 0);
        if (/\bvegan\b/.test(normalize(question)) && /\bvegan\b/.test(haystack)) score += 4;
        if (/\bsorbet(?:to)?\b/.test(normalize(question)) && /\bsorbet(?:to)?\b/.test(haystack)) score += 3;
        if (/no sugar|sugar free/.test(normalize(question)) && /no sugar added/.test(haystack)) score += 4;
        if (score > 0) matchesByScore.push({ flavor, group, score });
      });
    });

    matchesByScore.sort((a, b) => b.score - a.score || a.flavor.name.localeCompare(b.flavor.name));
    const best = matchesByScore.slice(0, 5);
    if (!best.length) {
      if (dietaryQuery) {
        return [
          textPart("I don’t see a matching choice on today’s published menu. Availability and labels can change, so please check the live menu or call us before visiting."),
          linkPart("Check today’s menu", "stock.html"),
          linkPart("Call the shop", STORE.phoneHref),
        ];
      }
      return null;
    }

    const names = best.map(({ flavor }) => flavor.name);
    const lead = names.length === 1
      ? `${names[0]} is on today’s published menu.`
      : `I found these on today’s published menu: ${formatList(names)}.`;
    const first = best[0];
    return [
      textPart(lead),
      linkPart(first.flavor.name, `${first.group.path}/${first.flavor.id}/`),
      linkPart("See everything in stock", "stock.html"),
    ];
  }

  async function loadStoreData() {
    const [stock] = await Promise.all([loadStock(), loadCatalogs()]);
    const catalogs = Object.fromEntries(Object.keys(catalogScripts).map((name) => [name, window[name] || { flavors: [] }]));
    return { stock, catalogs };
  }

  function loadStock() {
    if (!stockPromise) {
      stockPromise = fetch(`${ROOT_PATH}data/stock.json`, { cache: "no-store" })
        .then((response) => {
          if (!response.ok) throw new Error("Stock unavailable");
          return response.json();
        });
    }
    return stockPromise;
  }

  function loadCatalogs() {
    if (!catalogPromise) {
      catalogPromise = Promise.all(Object.entries(catalogScripts).map(([globalName, path]) => {
        if (window[globalName]) return Promise.resolve();
        return new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = `${ROOT_PATH}${path}`;
          script.onload = resolve;
          script.onerror = reject;
          document.head.append(script);
        });
      }));
    }
    return catalogPromise;
  }

  function availableIds(stock, groupKey, flavors) {
    const values = stock?.[groupKey];
    return new Set(values === "*" ? flavors.map((flavor) => flavor.id) : Array.isArray(values) ? values : []);
  }

  function fallbackAnswer() {
    return [
      textPart("I can help with today’s menu, flavor searches, hours, directions, rewards, or allergy information. For anything else, our team is happy to help by phone."),
      linkPart("See today’s menu", "stock.html"),
      linkPart(`Call ${STORE.phoneLabel}`, STORE.phoneHref),
    ];
  }

  function addUserMessage(message) {
    const bubble = element("div", "sweet-chat-message");
    bubble.dataset.author = "you";
    bubble.append(element("p", "", message));
    messages.append(bubble);
    scrollToLatest();
  }

  function addBotMessage(parts) {
    const bubble = element("div", "sweet-chat-message");
    bubble.dataset.author = "helper";
    parts.forEach((part) => bubble.append(part));
    messages.append(bubble);
    scrollToLatest();
  }

  function textPart(text) {
    return element("p", "", text);
  }

  function linkPart(label, href, external) {
    const paragraph = element("p");
    const link = element("a", "", label);
    link.href = href.startsWith("http") || href.startsWith("tel:") ? href : `${ROOT_PATH}${href}`;
    if (external) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    paragraph.append(link);
    return paragraph;
  }

  function scrollToLatest() {
    window.requestAnimationFrame(() => {
      messages.scrollTop = messages.scrollHeight;
    });
  }

  function normalize(value) {
    return String(value).toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9-]+/g, " ").trim();
  }

  function meaningfulWords(question) {
    const ignored = new Set(["a", "an", "and", "any", "are", "available", "do", "flavor", "flavors", "have", "i", "in", "is", "of", "on", "the", "today", "you"]);
    return [...new Set(normalize(question).split(" ").filter((word) => word.length > 2 && !ignored.has(word)))];
  }

  function matches(value, needles) {
    return needles.some((needle) => value.includes(needle));
  }

  function formatList(items) {
    if (items.length < 2) return items[0] || "";
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
  }

  function classifyQuestion(question) {
    const value = normalize(question);
    if (matches(value, ["hour", "open", "close", "time"])) return "hours";
    if (matches(value, ["address", "location", "direction", "map"])) return "location";
    if (matches(value, ["allerg", "ingredient", "gluten", "nut", "dairy"])) return "allergens";
    if (matches(value, ["stock", "menu", "flavor", "cream", "yogurt", "gelato", "sorbet", "vegan"])) return "menu";
    return "other";
  }

  function track(eventName, parameters = {}) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", eventName, { page_path: window.location.pathname, ...parameters });
  }

  function element(tagName, className, text) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
})();
