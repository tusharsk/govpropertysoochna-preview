(() => {
  const header = document.querySelector(".site-header");
  if (header) {
    const showScrollState = () => { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    showScrollState();
    window.addEventListener("scroll", showScrollState, { passive: true });
  }

  const menu = document.querySelector(".mobile-nav");
  if (menu) {
    const summary = menu.querySelector("summary");
    menu.addEventListener("toggle", () => {
      summary.setAttribute("aria-label", menu.open ? "Close navigation" : "Open navigation");
    });
    menu.querySelectorAll("a").forEach(link => link.addEventListener("click", () => { menu.open = false; }));
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && menu.open) {
        menu.open = false;
        summary.focus();
      }
    });
    document.addEventListener("pointerdown", event => {
      if (menu.open && !menu.contains(event.target)) menu.open = false;
    });
    document.addEventListener("focusin", event => {
      if (menu.open && !menu.contains(event.target)) menu.open = false;
    });
    const desktop = window.matchMedia("(min-width: 761px)");
    desktop.addEventListener("change", event => {
      if (event.matches) menu.open = false;
    });
  }

  const tickers = document.querySelectorAll(".ticker");
  if (tickers.length) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotion = () => {
      tickers.forEach(ticker => ticker.classList.toggle("motion-ready", !reduced.matches));
    };
    applyMotion();
    reduced.addEventListener("change", applyMotion);
  }

  const dialog = document.getElementById("channel-dialog");
  if (dialog && typeof dialog.showModal === "function") {
    document.querySelectorAll("[data-channel-unavailable]").forEach(link => {
      link.addEventListener("click", event => {
        event.preventDefault();
        document.getElementById("channel-region").textContent = link.dataset.regionName;
        document.getElementById("channel-contact").href = link.href;
        dialog.showModal();
      });
    });
    dialog.addEventListener("click", event => {
      if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
      }
    });
  }

  const wireSearch = ({ inputId, clearId, cardsSelector, chipSelector, statusId, emptyId, noun, published }) => {
    const input = document.getElementById(inputId);
    if (!input) return;
    const clear = document.getElementById(clearId);
    const status = document.getElementById(statusId);
    const empty = document.getElementById(emptyId);
    if (!clear || !status || !empty) throw new Error(`Incomplete search controls for ${inputId}`);
    const cards = Array.from(document.querySelectorAll(cardsSelector));
    const chips = Array.from(document.querySelectorAll(chipSelector));
    const apply = (value, selected) => {
      const terms = value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      let matches = 0;
      cards.forEach(card => {
        card.hidden = !terms.every(term => card.dataset.search.toLowerCase().includes(term));
        if (!card.hidden) matches += 1;
      });
      chips.forEach(chip => {
        const filter = chip.dataset.regionFilter ?? chip.dataset.filter;
        chip.setAttribute("aria-pressed", String(chip === selected || (!terms.length && filter === "")));
      });
      clear.disabled = !value;
      empty.hidden = matches !== 0;
      status.textContent = `${matches} ${noun}${matches === 1 ? "" : "s"} ${published ? "in the published snapshot." : "found"}`;
    };
    input.addEventListener("input", () => apply(input.value, null));
    input.addEventListener("search", () => apply(input.value, null));
    clear.addEventListener("click", () => {
      input.value = "";
      apply("", null);
      input.focus();
    });
    chips.forEach(chip => chip.addEventListener("click", () => {
      input.value = chip.dataset.regionFilter ?? chip.dataset.filter;
      apply(input.value, chip);
    }));
    const controls = input.closest("[data-search-controls]");
    if (controls) controls.hidden = false;
    input.value = new URLSearchParams(location.search).get("q") || "";
    apply(input.value, null);
  };
  wireSearch({
    inputId: "region-search", clearId: "region-clear",
    cardsSelector: "#region-results [data-search]", chipSelector: "[data-region-filter]",
    statusId: "region-status", emptyId: "region-empty", noun: "region", published: false
  });
  wireSearch({
    inputId: "city-search", clearId: "city-clear",
    cardsSelector: "#locations [data-search]", chipSelector: "[data-filter]",
    statusId: "location-meta", emptyId: "location-empty", noun: "finding", published: true
  });

  const archiveButtons = Array.from(document.querySelectorAll("[data-archive-filter]"));
  if (archiveButtons.length) {
    const cards = Array.from(document.querySelectorAll("[data-archive-region]"));
    const status = document.getElementById("archive-count");
    const empty = document.getElementById("archive-empty");
    if (!status || !empty) throw new Error("Incomplete archive filter controls");
    const apply = value => {
      let count = 0;
      cards.forEach(card => {
        card.hidden = Boolean(value && card.dataset.archiveRegion !== value);
        if (!card.hidden) count += 1;
      });
      archiveButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.archiveFilter === value)));
      status.textContent = `${count} published bulletin${count === 1 ? "" : "s"}`;
      empty.hidden = count !== 0;
    };
    const currentFilter = () => {
      const requested = new URLSearchParams(location.search).get("region") || "";
      return archiveButtons.some(button => button.dataset.archiveFilter === requested) ? requested : "";
    };
    archiveButtons.forEach(button => button.addEventListener("click", () => {
      const value = button.dataset.archiveFilter;
      const url = new URL(location.href);
      if (value) url.searchParams.set("region", value);
      else url.searchParams.delete("region");
      history.pushState({}, "", url);
      apply(value);
    }));
    const controls = archiveButtons[0].closest("[data-archive-controls]");
    if (controls) controls.hidden = false;
    window.addEventListener("popstate", () => apply(currentFilter()));
    apply(currentFilter());
  }
})();
