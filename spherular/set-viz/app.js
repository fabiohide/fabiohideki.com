// KeyForge Set-Viz App Logic — Fully Reactive Version

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Supabase Initialization
  const SUPABASE_URL = 'https://vzuzwvhktwzitqhthsor.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_w7AVjc_WtYrt5Q5w6fkNFg_gXWffvh0';
  let supabaseClient = null;

  if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } else {
    console.warn("Supabase library not loaded. List explorer will remain offline.");
  }

  // 2. State Management
  const state = {
    collections: ['DRACONIAN_MEASURES', 'GRIM_REMINDERS'],
    includeHouses: [],
    excludeHouses: [],
    houseMatchMode: 'any', // any, all, exact
    metric: 'sas',
    topPreset: '100', // 100, 50, 25, 10, 5, 1, 0.1, custom
    topPercent: 100,
    rankingScope: 'by_collection', // by_collection, global
    activeTab: 'overview',
    decks: [],
    decksOffset: 0,
    decksLimit: 50,
    hasMoreDecks: true,
    loadingDecks: false,
    aggregates: null, // Loaded from aggregates.json (static global view)
    filteredDecks: [] // Fetched dynamically from Supabase when filters are active
  };

  // Helper mappings
  const collectionNames = {
    'DRACONIAN_MEASURES': 'Draconian Measures',
    'GRIM_REMINDERS': 'Grim Reminders'
  };

  const metricLabels = {
    'sas': 'SAS Total',
    'aerc_base': 'AERC Base',
    'synergy_net': 'Sinergia Net',
    'synergy_positive': 'Sinergia Positiva',
    'synergy_negative': 'Sinergia Negativa',
    'expected_amber': 'Expected Amber',
    'amber_control': 'Amber Control',
    'creature_control': 'Creature Control',
    'effective_power': 'Effective Power'
  };

  const jsonMetricKeyMap = {
    'sas': 'sas',
    'aerc_base': 'aerc_base',
    'synergy_net': 'synergy_net',
    'synergy_positive': 'synergy_positive',
    'synergy_negative': 'synergy_negative',
    'expected_amber': 'expected_amber',
    'amber_control': 'amber_control',
    'creature_control': 'creature_control',
    'effective_power': 'effective_power'
  };

  const jsonAggMetricKeyMap = {
    'sas': 'sas',
    'aerc_base': 'aercBase',
    'synergy_net': 'synergyNet',
    'synergy_positive': 'synergyPositive',
    'synergy_negative': 'synergyNegative',
    'expected_amber': 'expectedAmber',
    'amber_control': 'amberControl',
    'creature_control': 'creatureControl',
    'effective_power': 'effectivePower'
  };

  const allHousesList = [
    'Brobnar', 'Ekwidon', 'Geistoid', 'Mars', 'Ouboros', 
    'Shadows', 'Skyborn', 'StarAlliance', 'Unfathomable', 'Untamed'
  ];

  // House colors for pill text badges
  function getHouseBadge(house) {
    const houseColors = {
      'Brobnar': '#ff5353',
      'Ekwidon': '#b1ff5f',
      'Geistoid': '#0ae448',
      'Mars': '#ff8709',
      'Ouboros': '#abff84',
      'Shadows': '#fec5fb',
      'Skyborn': '#00bae2',
      'StarAlliance': '#9d95ff',
      'Unfathomable': '#0087ff',
      'Untamed': '#abff84'
    };
    const color = houseColors[house] || '#fffce1';
    return `<span style="border: 1px solid ${color}44; background: ${color}11; color: ${color}; padding: 2px 8px; border-radius: 100px; font-size: 11px; font-weight: 600; margin-right: 4px;">${house}</span>`;
  }

  // Check if we are in dynamic filter mode
  function isDynamicMode() {
    const hasHouseFilters = state.includeHouses.length > 0 || state.excludeHouses.length > 0;
    const hasCutoff = state.topPreset !== '100';
    return hasHouseFilters || hasCutoff;
  }

  // Get responsive width based on container layout
  function getChartWidths() {
    const mainContent = document.querySelector('.main-content');
    // Generous padding subtraction to ensure it doesn't trigger scrollbars
    const totalWidth = mainContent ? (mainContent.clientWidth - 80) : 1000;
    return {
      fullWidth: Math.max(600, totalWidth),
      halfWidth: Math.max(450, (totalWidth - 32) / 2) // Subtracts grid gap
    };
  }

  // 3. Load Static Aggregate Data
  async function loadAggregateData() {
    try {
      const response = await fetch('./data/aggregates.json');
      if (!response.ok) throw new Error("Aggregates file not found");
      state.aggregates = await response.json();
      console.log("Static aggregates loaded:", state.aggregates);
    } catch (err) {
      console.error("Failed to load static aggregate JSON:", err);
      document.querySelector('.main-content').innerHTML = `
        <div style="padding: 100px 20px; text-align: center;">
          <h2 style="color: var(--color-ember-orange); margin-bottom: 16px;">Erro ao Carregar Dados</h2>
          <p style="color: var(--color-ash-gray); max-width: 500px; margin: 0 auto 32px;">
            Não foi possível carregar o arquivo estático de agregação. Por favor, execute o script de pré-processamento primeiro:
          </p>
          <code>python3 spherular/set-viz/scripts/preprocess.py</code>
        </div>
      `;
    }
  }

  // 4. URL Sync
  function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    
    if (params.has('collections')) {
      state.collections = params.get('collections').split(',');
    }
    if (params.has('include')) {
      state.includeHouses = params.get('include').split(',').filter(Boolean);
    }

    if (params.has('mode')) {
      state.houseMatchMode = params.get('mode');
    }
    if (params.has('metric')) {
      state.metric = params.get('metric');
    }
    if (params.has('top_preset')) {
      state.topPreset = params.get('top_preset');
    }
    if (params.has('top_percent')) {
      state.topPercent = parseFloat(params.get('top_percent'));
    }
    if (params.has('scope')) {
      state.rankingScope = params.get('scope');
    }
    if (params.has('tab')) {
      state.activeTab = params.get('tab');
    }
  }

  function updateUrlParams() {
    const params = new URLSearchParams();
    
    params.set('collections', state.collections.join(','));
    if (state.includeHouses.length > 0) params.set('include', state.includeHouses.join(','));

    params.set('mode', state.houseMatchMode);
    params.set('metric', state.metric);
    params.set('top_preset', state.topPreset);
    params.set('top_percent', state.topPercent);
    params.set('scope', state.rankingScope);
    params.set('tab', state.activeTab);
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }

  // 5. Sync UI Elements with State
  function syncUiFromState() {
    // Collections
    document.querySelectorAll('#collection-selector .pill-option').forEach(el => {
      const col = el.getAttribute('data-collection');
      if (state.collections.includes(col)) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Include Houses
    document.querySelectorAll('#include-houses-selector .pill-option').forEach(el => {
      const house = el.getAttribute('data-house');
      if (state.includeHouses.includes(house)) {
        el.classList.add('active-house');
      } else {
        el.classList.remove('active-house');
      }
    });



    // Selects
    document.getElementById('house-match-mode').value = state.houseMatchMode;
    document.getElementById('metric-select').value = state.metric;
    document.getElementById('top-preset-select').value = state.topPreset;
    const scopeEl = document.getElementById('ranking-scope');
    if (scopeEl) scopeEl.value = state.rankingScope;

    // Slider
    const sliderGroup = document.getElementById('custom-slider-group');
    if (state.topPreset === 'custom') {
      sliderGroup.style.display = 'flex';
      document.getElementById('top-percent-slider').value = state.topPercent;
      document.getElementById('slider-value-display').textContent = `${state.topPercent.toFixed(1)}%`;
    } else {
      sliderGroup.style.display = 'none';
    }

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(el => {
      if (el.getAttribute('data-tab') === state.activeTab) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    document.querySelectorAll('.tab-panel').forEach(panel => {
      if (panel.getAttribute('id') === `panel-${state.activeTab}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // Render Context Header
    updateContextHeader();
  }

  function updateContextHeader() {
    const titleEl = document.getElementById('dashboard-title');
    const chipsRow = document.getElementById('active-chips-row');
    if (!titleEl || !chipsRow) return; // Salvaguarda caso os elementos tenham sido removidos do DOM

    if (state.collections.length === 2) {
      titleEl.innerHTML = `Comparando <span>Draconian Measures</span> &amp; <span>Grim Reminders</span>`;
    } else if (state.collections.includes('DRACONIAN_MEASURES')) {
      titleEl.innerHTML = `Explorando <span>Draconian Measures</span>`;
    } else if (state.collections.includes('GRIM_REMINDERS')) {
      titleEl.innerHTML = `Explorando <span>Grim Reminders</span>`;
    } else {
      titleEl.innerHTML = `Selecione uma coleção na lateral`;
    }

    chipsRow.innerHTML = '';
    
    // Label inicial das Casas
    const labelSpan = document.createElement('span');
    labelSpan.style.fontSize = 'var(--text-caption)';
    labelSpan.style.color = 'var(--color-ash-gray)';
    labelSpan.style.fontWeight = 'var(--font-weight-semibold)';
    labelSpan.style.textTransform = 'uppercase';
    labelSpan.style.letterSpacing = '0.5px';
    labelSpan.style.marginRight = '4px';
    labelSpan.textContent = 'Casas: ';
    chipsRow.appendChild(labelSpan);

    // 1. Incluir Casas
    if (state.includeHouses.length > 0) {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.style.borderColor = 'var(--color-pulse-green)';
      chip.textContent = `Inclui: ${state.includeHouses.join(', ')}`;
      chipsRow.appendChild(chip);
    } else {
      // Estado default
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.style.borderColor = 'var(--color-olive-stone)';
      chip.textContent = 'Incluir: Todos';
      chipsRow.appendChild(chip);
    }


  }

  // 6. Dynamic Chart Render Controllers
  function renderAllCharts() {
    if (!state.aggregates) return;

    if (state.activeTab === 'overview') {
      renderOverview();
    } else if (state.activeTab === 'distribution') {
      renderDistribution();
    } else if (state.activeTab === 'houses') {
      renderHouses();
    } else if (state.activeTab === 'synergy') {
      renderSynergy();
    } else if (state.activeTab === 'aerc') {
      renderAercComponents();
    } else if (state.activeTab === 'decks-list') {
      resetDecksExplorer();
      fetchDecksFromSupabase();
    }
  }

  // Show Loading feedback on all charts
  function showLoadingCharts() {
    const divs = [
      'dumbbell-chart', 'ecdf-chart', 'histogram-chart', 
      'house-heatmap', 'house-ridgeline', 'synergy-density-dm', 
      'synergy-density-gr', 'synergy-scatter', 'aerc-bar-chart'
    ];
    divs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = `<div style="color: var(--color-ash-gray); font-size: 13px; text-align: center; width: 100%; padding: 60px 0;">Filtrando dados no Supabase...</div>`;
      }
    });
  }

  // 6.1 Visão Geral (Overview & Dumbbell)
  function renderOverview() {
    const kpiContainer = document.getElementById('kpi-container');
    kpiContainer.innerHTML = '';

    const activeAggs = [];
    const dynamic = isDynamicMode();
    const widths = getChartWidths();

    if (!dynamic) {
      // Static view from JSON
      state.collections.forEach(col => {
        if (state.aggregates[col]) {
          const stats = state.aggregates[col].summary.sas;
          activeAggs.push({ id: col, name: collectionNames[col], data: state.aggregates[col] });
          
          const card = document.createElement('div');
          card.className = 'kpi-card';
          card.setAttribute('data-collection', col);
          card.innerHTML = `
            <div class="kpi-label">${collectionNames[col]}</div>
            <div class="kpi-value">${state.aggregates[col].summary.total_decks.toLocaleString()} <span style="font-size: 14px; font-weight: normal; color: var(--color-ash-gray);">decks</span></div>
            <div class="kpi-subtitle">
              Média SAS: <strong>${stats.mean.toFixed(1)}</strong><br>
              P90 (Top 10%): <strong>${stats.p90.toFixed(0)}</strong> | P99 (Top 1%): <strong>${stats.p99.toFixed(0)}</strong>
            </div>
          `;
          kpiContainer.appendChild(card);
        }
      });
    } else {
      // Dynamic view from fetched decks
      state.collections.forEach(col => {
        const colDecks = state.filteredDecks.filter(d => d.expansion === col);
        const metricKey = jsonMetricKeyMap[state.metric];
        const stats = getDynamicSummary(colDecks, metricKey);
        
        activeAggs.push({
          id: col,
          name: collectionNames[col],
          data: {
            summary: {
              total_decks: colDecks.length,
              sas: stats // For dumbbell, map dynamically calculated stats
            }
          }
        });

        const card = document.createElement('div');
        card.className = 'kpi-card';
        card.setAttribute('data-collection', col);
        card.innerHTML = `
          <div class="kpi-label">${collectionNames[col]} (Filtrado)</div>
          <div class="kpi-value">${colDecks.length.toLocaleString()} <span style="font-size: 14px; font-weight: normal; color: var(--color-ash-gray);">decks</span></div>
          <div class="kpi-subtitle">
            Média ${metricLabels[state.metric]}: <strong>${stats.mean.toFixed(1)}</strong><br>
            P90 (Top 10%): <strong>${stats.p90.toFixed(0)}</strong> | P99 (Top 1%): <strong>${stats.p99.toFixed(0)}</strong>
          </div>
        `;
        kpiContainer.appendChild(card);
      });
    }

    // Dumbbell Chart
    const dumbbellContainer = document.getElementById('dumbbell-chart');
    dumbbellContainer.innerHTML = '';

    if (activeAggs.length === 0) return;

    const dumbbellData = [];
    activeAggs.forEach(agg => {
      const sas = agg.data.summary.sas;
      dumbbellData.push(
        { metric: 'Média', collection: agg.name, val: sas.mean },
        { metric: 'Top 10% (P90)', collection: agg.name, val: sas.p90 },
        { metric: 'Top 1% (P99)', collection: agg.name, val: sas.p99 }
      );
    });

    const dumbbellPlot = Plot.plot({
      style: {
        background: '#0e100f',
        color: '#fffce1',
        fontFamily: 'var(--font-mori)',
        fontSize: '14px' // Aumentado para melhor visibilidade
      },
      width: widths.fullWidth,
      height: 400, // Altura confortável para o espaçamento vertical
      marginLeft: 130, // Aumentado de 120 para 130 para dar mais margem aos labels do eixo Y
      marginBottom: 60,
      marginRight: 60,
      x: { grid: true, label: `Valor do ${metricLabels[state.metric]}`, labelOffset: 45 },
      y: { label: null, domain: ['Média', 'Top 10% (P90)', 'Top 1% (P99)'], padding: 0.8 }, // Mantém o espaçamento confortável
      color: {
        domain: ['Draconian Measures', 'Grim Reminders'],
        range: ['#fec5fb', '#00bae2'],
        legend: true // Ativa legenda de cores para ficar bem explícito
      },
      marks: [
        Plot.link(dumbbellData, {
          x: "val",
          y: "metric",
          z: "metric",
          stroke: "#42433d",
          strokeWidth: 2
        }),
        Plot.dot(dumbbellData, {
          x: "val",
          y: "metric",
          fill: "collection",
          r: 6
        }),
        // Rótulos de dados posicionados à direita do ponto colorido com halo de legibilidade
        Plot.text(dumbbellData, {
          x: "val",
          y: "metric",
          text: d => d.val.toFixed(1),
          dx: 10, // Deslocamento para a direita do ponto colorido
          dy: d => d.collection === 'Draconian Measures' ? -6 : 6, // Leve offset vertical alternado para evitar colisão horizontal
          textAnchor: "start",
          fill: '#fffce1',
          fontWeight: 600,
          stroke: "#0e100f",
          strokeWidth: 4,
          paintOrder: "stroke" // Desenha o contorno por trás do texto
        })
      ]
    });

    dumbbellContainer.appendChild(dumbbellPlot);
  }

  // 6.2 Distribuição (ECDF e Histograma)
  function renderDistribution() {
    const ecdfContainer = document.getElementById('ecdf-chart');
    ecdfContainer.innerHTML = '';
    const histContainer = document.getElementById('histogram-chart');
    histContainer.innerHTML = '';

    const key = jsonMetricKeyMap[state.metric];
    const aggKey = jsonAggMetricKeyMap[state.metric];
    const dynamic = isDynamicMode();
    const widths = getChartWidths();

    const ecdfData = [];
    const histData = [];

    if (!dynamic) {
      // Render from aggregates.json
      state.collections.forEach(col => {
        const agg = state.aggregates[col];
        if (agg && agg.ecdf && agg.ecdf[aggKey]) {
          agg.ecdf[aggKey].forEach(pt => {
            ecdfData.push({ p: pt.p, val: pt.val, collection: collectionNames[col] });
          });
        }
        if (agg && agg.histograms && agg.histograms[aggKey]) {
          agg.histograms[aggKey].forEach(bin => {
            histData.push({ x0: bin.x0, x1: bin.x1, count: bin.count, collection: collectionNames[col] });
          });
        }
      });
    } else {
      // Render dynamically from fetched decks
      state.collections.forEach(col => {
        const colDecks = state.filteredDecks.filter(d => d.expansion === col);
        const dynamicEcdf = getDynamicEcdf(colDecks, key);
        const dynamicHist = getDynamicHistogram(colDecks, key, 1);
        
        dynamicEcdf.forEach(pt => {
          ecdfData.push({ p: pt.p, val: pt.val, collection: collectionNames[col] });
        });
        dynamicHist.forEach(bin => {
          histData.push({ x0: bin.x0, x1: bin.x1, count: bin.count, collection: collectionNames[col] });
        });
      });
    }

    // 1. ECDF Plot
    if (ecdfData.length > 0) {
      const ecdfPlot = Plot.plot({
        style: { 
          background: '#0e100f', 
          color: '#fffce1', 
          fontFamily: 'var(--font-mori)', 
          fontSize: '14px' // Aumentado de 13px para 14px
        },
        width: widths.halfWidth,
        height: 450, // Aumentado de 350
        marginBottom: 65,
        marginRight: 60,
        marginLeft: 65,
        x: { grid: true, label: `${metricLabels[state.metric]}`, labelOffset: 50 },
        y: { grid: true, label: "Percentil (%) - Decks piores ou iguais" },
        color: {
          domain: ['Draconian Measures', 'Grim Reminders'],
          range: ['#fec5fb', '#00bae2']
        },
        marks: [
          Plot.line(ecdfData, {
            x: "val",
            y: "p",
            stroke: "collection",
            strokeWidth: 2
          }),
          Plot.ruleY([100 - state.topPercent], { stroke: '#42433d', strokeDasharray: '4 4' }),
          Plot.text([`Corte Superior ${state.topPercent}%`], { 
            y: 100 - state.topPercent, 
            x: d3.min(ecdfData, d => d.val), 
            dy: -10, 
            dx: 10,
            textAnchor: "start",
            fill: "var(--color-cream-glow)",
            fontWeight: 600,
            fontSize: "12px",
            stroke: "#0e100f",
            strokeWidth: 4,
            paintOrder: "stroke" // Halo de legibilidade
          })
        ]
      });
      ecdfContainer.appendChild(ecdfPlot);
    }

    // 2. Histograma Plot
    if (histData.length > 0) {
      const histPlot = Plot.plot({
        style: { 
          background: '#0e100f', 
          color: '#fffce1', 
          fontFamily: 'var(--font-mori)', 
          fontSize: '14px' // Aumentado de 13px para 14px
        },
        width: widths.halfWidth,
        height: 450, // Aumentado de 350
        marginBottom: 65,
        marginRight: 60,
        marginLeft: 65,
        x: { grid: true, label: `${metricLabels[state.metric]}`, labelOffset: 50 },
        y: { grid: true, label: "Quantidade de decks" },
        color: {
          domain: ['Draconian Measures', 'Grim Reminders'],
          range: ['#fec5fb', '#00bae2']
        },
        marks: [
          Plot.rectY(histData, {
            x1: "x0",
            x2: "x1",
            y: "count",
            fill: "collection",
            fillOpacity: 0.4,
            stroke: "collection",
            strokeWidth: 1
          })
        ]
      });
      histContainer.appendChild(histPlot);
    }
  }

  // 6.3 Casas (Heatmap e Ridgeline)
  function renderHouses() {
    const measure = document.getElementById('house-metric-selector').value;
    const heatmapContainer = document.getElementById('house-heatmap');
    heatmapContainer.innerHTML = '';
    const ridgelineContainer = document.getElementById('house-ridgeline');
    ridgelineContainer.innerHTML = '';

    const dynamic = isDynamicMode();
    const widths = getChartWidths();
    const heatmapData = [];
    const ridgelineData = [];

    if (!dynamic) {
      // Static from JSON
      state.collections.forEach(col => {
        const agg = state.aggregates[col];
        if (agg && agg.houses) {
          Object.entries(agg.houses).forEach(([house, hData]) => {
            let val = 0;
            if (measure === 'mean') val = hData.sas_est.mean;
            else if (measure === 'p90') val = hData.sas_est.p90;
            else if (measure === 'p99') val = hData.sas_est.p99;
            else if (measure === 'max') val = hData.sas_est.max;
            
            heatmapData.push({ collection: collectionNames[col], house: house, val: val });
            
            if (hData.sas_est_hist) {
              hData.sas_est_hist.forEach(bin => {
                ridgelineData.push({
                  house: house,
                  collection: collectionNames[col],
                  x: (bin.x0 + bin.x1) / 2,
                  y: bin.count
                });
              });
            }
          });
        }
      });
    } else {
      // Dynamic from fetched decks + nested houses
      state.collections.forEach(col => {
        const colDecks = state.filteredDecks.filter(d => d.expansion === col);
        const housesSummary = getDynamicHouseStats(colDecks);
        
        Object.entries(housesSummary).forEach(([house, hData]) => {
          let val = 0;
          if (measure === 'mean') val = hData.sas_est.mean;
          else if (measure === 'p90') val = hData.sas_est.p90;
          else if (measure === 'p99') val = hData.sas_est.p99;
          else if (measure === 'max') val = hData.sas_est.max;
          
          heatmapData.push({ collection: collectionNames[col], house: house, val: val });
          
          if (hData.sas_est_hist) {
            hData.sas_est_hist.forEach(bin => {
              ridgelineData.push({
                house: house,
                collection: collectionNames[col],
                x: (bin.x0 + bin.x1) / 2,
                y: bin.count
              });
            });
          }
        });
      });
    }

    // 1. Heatmap Plot
    if (heatmapData.length > 0) {
      const heatPlot = Plot.plot({
        style: { 
          background: '#0e100f', 
          color: '#fffce1', 
          fontFamily: 'var(--font-mori)', 
          fontSize: '14px' // Aumentado de 13px para 14px
        },
        width: widths.fullWidth,
        height: 450, // Aumentado de 300 para espaciar as casas
        marginLeft: 130, // Aumentado para visualizar o nome completo das casas no eixo Y
        marginBottom: 50,
        marginRight: 50,
        x: { label: null, tickPadding: 8, padding: 0.15 }, // Adicionado padding para células flutuantes
        y: { label: null, domain: allHousesList, padding: 0.15 }, // Adicionado padding para células flutuantes
        color: {
          type: "linear",
          scheme: "greens",
          label: `${measure.toUpperCase()} do SAS Estimado por Casa`,
          legend: true
        },
        marks: [
          Plot.cell(heatmapData, {
            x: "collection",
            y: "house",
            fill: "val"
          }),
          // Rótulo de texto centralizado na célula com halo de legibilidade
          Plot.text(heatmapData, {
            x: "collection",
            y: "house",
            text: d => d.val.toFixed(1),
            fill: '#fffce1', 
            fontWeight: 600,
            fontSize: "13px", // Aumentado de 11px/12px para 13px
            stroke: "#0e100f",
            strokeWidth: 4,
            paintOrder: "stroke"
          })
        ]
      });
      heatmapContainer.appendChild(heatPlot);
    }

    // 2. Ridgeline Plot
    if (ridgelineData.length > 0) {
      const ridgePlot = Plot.plot({
        style: { 
          background: '#0e100f', 
          color: '#fffce1', 
          fontFamily: 'var(--font-mori)', 
          fontSize: '14px' // Aumentado de 13px para 14px
        },
        width: widths.fullWidth,
        height: 700, // Altura confortável para as densidades
        marginLeft: 130, // Aumentado para visualizar o nome completo das casas
        marginBottom: 60,
        marginRight: 60,
        x: { label: "SAS Estimado por Casa", grid: true, labelOffset: 45 },
        y: { grid: true, label: "Decks", axis: null },
        fy: { label: null, domain: allHousesList, padding: 0.5 }, // Mantém o espaçamento confortável
        color: {
          domain: ['Draconian Measures', 'Grim Reminders'],
          range: ['#fec5fb', '#00bae2']
        },
        marks: [
          Plot.areaY(ridgelineData, {
            x: "x",
            y: "y",
            fill: "collection",
            fillOpacity: 0.3,
            stroke: "collection",
            strokeWidth: 1,
            curve: "basis"
          }),
          Plot.text(allHousesList, {
            fy: d => d,
            x: d3.min(ridgelineData, d => d.x) - 6, // Afastado de -4 para -6 para mais respiro
            text: d => d,
            textAnchor: "end",
            fill: "var(--color-cream-glow)",
            fontWeight: 600,
            fontSize: "13px", // Aumentado de 12px para 13px
            stroke: "#0e100f",
            strokeWidth: 4,
            paintOrder: "stroke" // Contorno nítido por trás do texto
          })
        ]
      });
      ridgelineContainer.appendChild(ridgePlot);
    }
  }

  // 6.4 Sinergia e Base (Scatter e Density)
  function renderSynergy() {
    const scatterContainer = document.getElementById('synergy-scatter');
    scatterContainer.innerHTML = '';
    const dmDensityContainer = document.getElementById('synergy-density-dm');
    dmDensityContainer.innerHTML = '';
    const grDensityContainer = document.getElementById('synergy-density-gr');
    grDensityContainer.innerHTML = '';

    const dynamic = isDynamicMode();
    const widths = getChartWidths();
    let dmDensity = [];
    let grDensity = [];

    if (!dynamic) {
      dmDensity = state.aggregates['DRACONIAN_MEASURES']?.synergy_density || [];
      grDensity = state.aggregates['GRIM_REMINDERS']?.synergy_density || [];
    } else {
      const dmDecks = state.filteredDecks.filter(d => d.expansion === 'DRACONIAN_MEASURES');
      const grDecks = state.filteredDecks.filter(d => d.expansion === 'GRIM_REMINDERS');
      
      dmDensity = getDynamicDensity(dmDecks, 'aerc_base', 'synergy_net', 2, 1);
      grDensity = getDynamicDensity(grDecks, 'aerc_base', 'synergy_net', 2, 1);
    }

    // Render DM Density
    if (dmDensity.length > 0) {
      const dmPlot = Plot.plot({
        style: { background: '#0e100f', color: '#fffce1', fontFamily: 'var(--font-mori)', fontSize: '14px' }, // Aumentado de 13px para 14px
        width: widths.halfWidth,
        height: 500, // Aumentado de 450 para 500
        marginBottom: 65,
        marginRight: 60,
        marginLeft: 65,
        x: { label: "AERC Base", grid: true, labelOffset: 50 },
        y: { label: "Sinergia Net", grid: true },
        color: { type: "log", scheme: "magma", label: "Densidade de Decks", legend: true },
        marks: [
          Plot.rect(dmDensity, {
            x1: d => d.x - 1,
            x2: d => d.x + 1,
            y1: d => d.y - 0.5,
            y2: d => d.y + 0.5,
            fill: "count"
          })
        ]
      });
      dmDensityContainer.appendChild(dmPlot);
    }

    // Render GR Density
    if (grDensity.length > 0) {
      const grPlot = Plot.plot({
        style: { background: '#0e100f', color: '#fffce1', fontFamily: 'var(--font-mori)', fontSize: '14px' }, // Aumentado de 13px para 14px
        width: widths.halfWidth,
        height: 500, // Aumentado de 450 para 500
        marginBottom: 65,
        marginRight: 60,
        marginLeft: 65,
        x: { label: "AERC Base", grid: true, labelOffset: 50 },
        y: { label: "Sinergia Net", grid: true },
        color: { type: "log", scheme: "magma", label: "Densidade de Decks", legend: true },
        marks: [
          Plot.rect(grDensity, {
            x1: d => d.x - 1,
            x2: d => d.x + 1,
            y1: d => d.y - 0.5,
            y2: d => d.y + 0.5,
            fill: "count"
          })
        ]
      });
      grDensityContainer.appendChild(grPlot);
    }

    // Combined scatter plot
    const combinedScatterData = [];
    dmDensity.forEach(pt => {
      combinedScatterData.push({ x: pt.x, y: pt.y, count: pt.count, collection: 'Draconian Measures' });
    });
    grDensity.forEach(pt => {
      combinedScatterData.push({ x: pt.x, y: pt.y, count: pt.count, collection: 'Grim Reminders' });
    });

    if (combinedScatterData.length > 0) {
      const scatterPlot = Plot.plot({
        style: { background: '#0e100f', color: '#fffce1', fontFamily: 'var(--font-mori)', fontSize: '14px' }, // Aumentado de 13px para 14px
        width: widths.fullWidth,
        height: 600, // Aumentado de 550 para 600
        marginBottom: 65,
        marginRight: 60,
        marginLeft: 65,
        x: { label: "AERC Base (Força bruta dos cards)", grid: true, labelOffset: 50 },
        y: { label: "Sinergia Net (Sinergia - Antissinergia)", grid: true },
        color: {
          domain: ['Draconian Measures', 'Grim Reminders'],
          range: ['#fec5fb', '#00bae2']
        },
        r: { type: "linear", range: [2, 12] },
        marks: [
          Plot.dot(combinedScatterData, {
            x: "x",
            y: "y",
            fill: "collection",
            r: "count",
            fillOpacity: 0.3,
            stroke: "collection",
            strokeWidth: 1
          })
        ]
      });
      scatterContainer.appendChild(scatterPlot);
    }
  }

  // 6.5 Componentes AERC (Horizontal Grouped Bar)
  function renderAercComponents() {
    const aercContainer = document.getElementById('aerc-bar-chart');
    aercContainer.innerHTML = '';

    const componentsList = [
      { key: 'expectedAmber', label: 'Expected Amber', jsonKey: 'expected_amber' },
      { key: 'amberControl', label: 'Amber Control', jsonKey: 'amber_control' },
      { key: 'creatureControl', label: 'Creature Control', jsonKey: 'creature_control' },
      { key: 'artifactControl', label: 'Artifact Control', jsonKey: 'artifact_control' },
      { key: 'efficiency', label: 'Efficiency', jsonKey: 'efficiency' },
      { key: 'recursion', label: 'Recursion', jsonKey: 'recursion' },
      { key: 'effectivePower', label: 'Effective Power', jsonKey: 'effective_power' },
      { key: 'creatureProtection', label: 'Creature Protection', jsonKey: 'creature_protection' },
      { key: 'disruption', label: 'Disruption', jsonKey: 'disruption' },
      { key: 'other', label: 'Other', jsonKey: 'other' }
    ];

    const barData = [];
    const dynamic = isDynamicMode();
    const widths = getChartWidths();

    if (!dynamic) {
      // Static from JSON
      state.collections.forEach(col => {
        const agg = state.aggregates[col];
        if (agg && agg.aerc_components) {
          componentsList.forEach(comp => {
            const compData = agg.aerc_components[comp.key];
            if (compData) {
              barData.push({ component: comp.label, collection: collectionNames[col], value: compData.mean });
            }
          });
        }
      });
    } else {
      // Dynamic from fetched decks
      state.collections.forEach(col => {
        const colDecks = state.filteredDecks.filter(d => d.expansion === col);
        componentsList.forEach(comp => {
          const values = colDecks.map(d => d[comp.jsonKey]).filter(v => v !== null && v !== undefined);
          const valueMean = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
          barData.push({ component: comp.label, collection: collectionNames[col], value: valueMean });
        });
      });
    }

    if (barData.length > 0) {
      const barPlot = Plot.plot({
        style: { 
          background: '#0e100f', 
          color: '#fffce1', 
          fontFamily: 'var(--font-mori)', 
          fontSize: '14px' // Aumentado de 13px para 14px
        },
        width: widths.fullWidth,
        height: 650, // Altura confortável para os componentes
        marginLeft: 150, // Espaço para os nomes dos componentes à esquerda
        marginRight: 60, // Aumentado de 45 para 60
        marginBottom: 60,
        x: { grid: true, label: "Pontuação Média", labelOffset: 45 },
        y: { label: null, tickFormat: () => "", padding: 0.4 }, // Padding interno entre as duas barras
        fy: { 
          label: null, 
          domain: componentsList.map(c => c.label),
          axis: "left",
          padding: 0.6 // Espaçamento confortável entre componentes
        },
        color: {
          domain: ['Draconian Measures', 'Grim Reminders'],
          range: ['#fec5fb', '#00bae2'],
          legend: true
        },
        marks: [
          Plot.barX(barData, {
            x: "value",
            y: "collection",
            fill: "collection",
            stroke: "#0e100f",
            strokeWidth: 1
          }),
          // Rótulo de texto posicionado à direita da barra com halo de legibilidade
          Plot.text(barData, {
            x: "value",
            y: "collection",
            text: d => d.value.toFixed(1),
            dx: 8, // Deslocamento para a direita da barra
            fill: "#fffce1",
            fontSize: "12px", // Aumentado de 11px para 12px
            fontWeight: "600",
            textAnchor: "start",
            stroke: "#0e100f",
            strokeWidth: 4,
            paintOrder: "stroke"
          })
        ]
      });
      aercContainer.appendChild(barPlot);
    }
  }

  // 7. Supabase Database Integration (Elite Decks List)
  function calculateCutoffs() {
    if (!state.aggregates) return { dmCutoff: 0, grCutoff: 0 };
    
    const targetPercentile = 100 - state.topPercent;
    const aggKey = jsonAggMetricKeyMap[state.metric];
    
    function getCutoff(colId) {
      const agg = state.aggregates[colId];
      if (!agg) return 0;
      
      const ecdf = agg.ecdf[aggKey];
      if (!ecdf) return 0;
      
      let closest = ecdf[0];
      let minDiff = Math.abs(closest.p - targetPercentile);
      
      for (let i = 1; i < ecdf.length; i++) {
        const diff = Math.abs(ecdf[i].p - targetPercentile);
        if (diff < minDiff) {
          minDiff = diff;
          closest = ecdf[i];
        }
      }
      return closest.val;
    }
    
    const dmCutoff = getCutoff('DRACONIAN_MEASURES');
    const grCutoff = getCutoff('GRIM_REMINDERS');
    
    let globalCutoff = 0;
    if (state.aggregates['DRACONIAN_MEASURES'] && state.aggregates['GRIM_REMINDERS']) {
      const totalDm = state.aggregates['DRACONIAN_MEASURES'].summary.total_decks;
      const totalGr = state.aggregates['GRIM_REMINDERS'].summary.total_decks;
      const totalCombined = totalDm + totalGr;
      const targetDecksCount = totalCombined * (state.topPercent / 100);
      
      let low = 40;
      let high = 140;
      let bestVal = 0;
      let bestDiff = Infinity;
      
      for (let val = low; val <= high; val++) {
        const dmEcdf = state.aggregates['DRACONIAN_MEASURES'].ecdf[aggKey] || [];
        const grEcdf = state.aggregates['GRIM_REMINDERS'].ecdf[aggKey] || [];
        
        let dmP = 100;
        let grP = 100;
        
        for (let pt of dmEcdf) {
          if (pt.val >= val) { dmP = pt.p; break; }
        }
        for (let pt of grEcdf) {
          if (pt.val >= val) { grP = pt.p; break; }
        }
        
        const dmDecks = totalDm * (1 - dmP/100);
        const grDecks = totalGr * (1 - grP/100);
        const combined = dmDecks + grDecks;
        
        const diff = Math.abs(combined - targetDecksCount);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestVal = val;
        }
      }
      globalCutoff = bestVal;
    } else {
      globalCutoff = dmCutoff || grCutoff;
    }
    
    return { dmCutoff, grCutoff, globalCutoff };
  }

  // Fetch filtered decks from Supabase for dynamically building charts (Case B)
  async function fetchFilteredDecksForCharts() {
    if (!supabaseClient) return;

    try {
      const { dmCutoff, grCutoff, globalCutoff } = calculateCutoffs();
      const queryMetric = jsonMetricKeyMap[state.metric];
      
      let query = supabaseClient
        .from('kf_decks')
        .select('*, kf_deck_houses(*)');

      // 1. Collections
      if (state.collections.length > 0) {
        query = query.in('expansion', state.collections);
      } else {
        state.filteredDecks = [];
        return;
      }

      // 2. Cutoff/Percentile
      if (state.topPreset !== '100') {
        if (state.rankingScope === 'by_collection') {
          if (state.collections.includes('DRACONIAN_MEASURES') && state.collections.includes('GRIM_REMINDERS')) {
            query = query.or(`and(expansion.eq.DRACONIAN_MEASURES,${queryMetric}.gte.${dmCutoff}),and(expansion.eq.GRIM_REMINDERS,${queryMetric}.gte.${grCutoff})`);
          } else if (state.collections.includes('DRACONIAN_MEASURES')) {
            query = query.gte(queryMetric, dmCutoff);
          } else {
            query = query.gte(queryMetric, grCutoff);
          }
        } else {
          query = query.gte(queryMetric, globalCutoff);
        }
      }

      // 3. Include Houses
      if (state.includeHouses.length > 0) {
        if (state.houseMatchMode === 'any') {
          query = query.overlaps('houses', state.includeHouses);
        } else if (state.houseMatchMode === 'all') {
          query = query.contains('houses', state.includeHouses);
        } else if (state.houseMatchMode === 'exact') {
          if (state.includeHouses.length === 3) {
            query = query.contains('houses', state.includeHouses);
          } else {
            state.filteredDecks = [];
            return;
          }
        }
      }



      // 5. Order and safety limit for rendering speed
      query = query
        .order(queryMetric, { ascending: false })
        .limit(5000);

      const { data, error } = await query;
      if (error) throw error;

      state.filteredDecks = data || [];
      console.log(`Dynamic charts loaded with ${state.filteredDecks.length} decks.`);

    } catch (err) {
      console.error("Failed to fetch filtered decks for charts:", err);
      state.filteredDecks = [];
    }
  }

  // Fetch filtered decks for the tab list (table pagination)
  async function fetchDecksFromSupabase() {
    if (!supabaseClient) {
      showExplorerError("Biblioteca do Supabase não configurada.");
      return;
    }

    if (state.loadingDecks) return;
    state.loadingDecks = true;

    const tbody = document.getElementById('decks-table-body');
    if (state.decksOffset === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-ash-gray); padding: 40px;">Procurando decks no Supabase...</td></tr>`;
    }

    const loadMoreBtn = document.getElementById('load-more-btn');
    loadMoreBtn.style.display = 'none';

    try {
      const { dmCutoff, grCutoff, globalCutoff } = calculateCutoffs();
      const queryMetric = jsonMetricKeyMap[state.metric];
      
      let query = supabaseClient
        .from('kf_decks')
        .select('*');

      if (state.collections.length > 0) {
        query = query.in('expansion', state.collections);
      } else {
        state.loadingDecks = false;
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-ash-gray); padding: 40px;">Nenhuma coleção selecionada.</td></tr>`;
        return;
      }

      if (state.topPreset !== '100') {
        if (state.rankingScope === 'by_collection') {
          if (state.collections.includes('DRACONIAN_MEASURES') && state.collections.includes('GRIM_REMINDERS')) {
            query = query.or(`and(expansion.eq.DRACONIAN_MEASURES,${queryMetric}.gte.${dmCutoff}),and(expansion.eq.GRIM_REMINDERS,${queryMetric}.gte.${grCutoff})`);
          } else if (state.collections.includes('DRACONIAN_MEASURES')) {
            query = query.gte(queryMetric, dmCutoff);
          } else {
            query = query.gte(queryMetric, grCutoff);
          }
        } else {
          query = query.gte(queryMetric, globalCutoff);
        }
      }

      if (state.includeHouses.length > 0) {
        if (state.houseMatchMode === 'any') {
          query = query.overlaps('houses', state.includeHouses);
        } else if (state.houseMatchMode === 'all') {
          query = query.contains('houses', state.includeHouses);
        } else if (state.houseMatchMode === 'exact') {
          if (state.includeHouses.length === 3) {
            query = query.contains('houses', state.includeHouses);
          } else {
            state.loadingDecks = false;
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-ash-gray); padding: 40px;">Decks KeyForge possuem exatamente 3 casas. Filtro exato com ${state.includeHouses.length} casas não retornará dados.</td></tr>`;
            return;
          }
        }
      }



      query = query
        .order(queryMetric, { ascending: false })
        .range(state.decksOffset, state.decksOffset + state.decksLimit - 1);

      const { data, error } = await query;
      if (error) throw error;

      state.loadingDecks = false;

      if (state.decksOffset === 0) {
        state.decks = [];
        tbody.innerHTML = '';
      }

      if (!data || data.length === 0) {
        state.hasMoreDecks = false;
        if (state.decksOffset === 0) {
          tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-ash-gray); padding: 40px;">Nenhum deck encontrado correspondendo aos filtros.</td></tr>`;
        }
        return;
      }

      state.decks = state.decks.concat(data);
      state.decksOffset += data.length;
      state.hasMoreDecks = data.length === state.decksLimit;

      renderDecksTable(data);

      if (state.hasMoreDecks) {
        loadMoreBtn.style.display = 'inline-flex';
      } else {
        loadMoreBtn.style.display = 'none';
      }

    } catch (err) {
      console.error("Supabase query error:", err);
      state.loadingDecks = false;
      showExplorerError(err.message);
    }
  }

  function renderDecksTable(newDecks) {
    const tbody = document.getElementById('decks-table-body');
    if (state.decks.length === newDecks.length) {
      tbody.innerHTML = '';
    }

    newDecks.forEach((d, index) => {
      const pos = state.decks.length - newDecks.length + index + 1;
      const row = document.createElement('tr');
      
      const badgeClass = d.expansion === 'DRACONIAN_MEASURES' ? 'badge-dm' : 'badge-gr';
      const expansionName = d.expansion === 'DRACONIAN_MEASURES' ? 'DM' : 'GR';
      const houseBadges = d.houses.map(h => getHouseBadge(h)).join('');
      const dokDetailsUrl = `https://www.decksofkeyforge.com/decks?title=${encodeURIComponent(d.name)}`;

      row.innerHTML = `
        <td style="color: var(--color-ash-gray); font-size: 13px;">#${pos}</td>
        <td>
          <div class="deck-name-col">
            <a href="${dokDetailsUrl}" target="_blank" class="deck-name" title="${d.name}">
              ${d.name}
            </a>
          </div>
        </td>
        <td>
          <span class="expansion-badge ${badgeClass}">${expansionName}</span>
        </td>
        <td>
          <div class="table-house-icons">
            ${houseBadges}
          </div>
        </td>
        <td style="text-align: center; font-weight: 600;">${d.sas}</td>
        <td style="text-align: center; color: var(--color-ash-gray);">${d.aerc_base}</td>
        <td style="text-align: center; color: ${d.synergy_net >= 0 ? 'var(--color-pulse-green)' : 'var(--color-ember-orange)'};">
          ${d.synergy_net >= 0 ? '+' : ''}${d.synergy_net}
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  function resetDecksExplorer() {
    state.decks = [];
    state.decksOffset = 0;
    state.hasMoreDecks = true;
    state.loadingDecks = false;
  }

  function showExplorerError(message) {
    const tbody = document.getElementById('decks-table-body');
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: var(--color-ash-gray);">
          <div style="color: var(--color-ember-orange); font-weight: 600; margin-bottom: 8px;">Erro na consulta do banco de dados</div>
          <div style="font-size: 13px; margin-bottom: 16px;">${message}</div>
          <div style="font-size: 12px; max-width: 450px; margin: 0 auto; line-height: 1.4;">
            As tabelas <strong>kf_decks</strong> e <strong>kf_deck_houses</strong> podem não estar criadas ou populadas no Supabase.
            Siga os passos em <code>spherular/set-viz/supabase/README.md</code> para carregar os dados.
          </div>
        </td>
      </tr>
    `;
    document.getElementById('load-more-btn').style.display = 'none';
  }

  // 8. Dynamic Aggregation Computation Helpers (JavaScript side)
  function getDynamicSummary(decks, metricKey) {
    if (decks.length === 0) return { mean: 0, median: 0, min: 0, max: 0, p50: 0, p75: 0, p90: 0, p95: 0, p99: 0, p99_9: 0 };
    const values = decks.map(d => d[metricKey]).filter(v => v !== null && v !== undefined).sort((a, b) => a - b);
    if (values.length === 0) return { mean: 0, median: 0, min: 0, max: 0, p50: 0, p75: 0, p90: 0, p95: 0, p99: 0, p99_9: 0 };
    
    const sum = values.reduce((acc, v) => acc + v, 0);
    const mean = sum / values.length;
    const getPercentile = (p) => {
      const idx = Math.min(Math.floor((p / 100) * values.length), values.length - 1);
      return values[idx];
    };
    return {
      mean: mean,
      median: getPercentile(50),
      min: values[0],
      max: values[values.length - 1],
      p50: getPercentile(50),
      p75: getPercentile(75),
      p90: getPercentile(90),
      p95: getPercentile(95),
      p99: getPercentile(99),
      p99_9: getPercentile(99.9)
    };
  }

  function getDynamicEcdf(decks, metricKey) {
    if (decks.length === 0) return [];
    const values = decks.map(d => d[metricKey]).filter(v => v !== null && v !== undefined).sort((a, b) => a - b);
    if (values.length === 0) return [];
    
    const ecdf = [];
    const percentiles = [];
    for (let p = 0; p < 99; p += 1) percentiles.push(p);
    for (let p = 99; p <= 100; p += 0.1) percentiles.push(p);
    
    percentiles.forEach(p => {
      const idx = Math.min(Math.floor((p / 100) * values.length), values.length - 1);
      ecdf.push({ p: p, val: values[idx] });
    });
    return ecdf;
  }

  function getDynamicHistogram(decks, metricKey, binWidth = 1) {
    if (decks.length === 0) return [];
    const values = decks.map(d => d[metricKey]).filter(v => v !== null && v !== undefined);
    if (values.length === 0) return [];
    
    const minVal = Math.floor(Math.min(...values));
    const maxVal = Math.ceil(Math.max(...values));
    const binsCount = Math.ceil((maxVal - minVal) / binWidth) + 1;
    
    const bins = Array.from({ length: binsCount }, (_, i) => ({
      x0: minVal + i * binWidth,
      x1: minVal + (i + 1) * binWidth,
      count: 0
    }));
    
    values.forEach(v => {
      const binIdx = Math.floor((v - minVal) / binWidth);
      if (binIdx >= 0 && binIdx < bins.length) {
        bins[binIdx].count++;
      }
    });
    return bins.filter(b => b.count > 0);
  }

  function getDynamicDensity(decks, xKey, yKey, xStep = 2, yStep = 1) {
    const grid = {};
    decks.forEach(d => {
      const x = d[xKey];
      const y = d[yKey];
      if (x === null || y === null || x === undefined || y === undefined) return;
      const xBin = Math.round(x / xStep) * xStep;
      const yBin = Math.round(y / yStep) * yStep;
      const key = `${xBin}_${yBin}`;
      if (!grid[key]) {
        grid[key] = { x: xBin, y: yBin, count: 0 };
      }
      grid[key].count++;
    });
    return Object.values(grid);
  }

  function getDynamicHouseStats(decks) {
    const houseData = {};
    decks.forEach(d => {
      const hDetails = d.kf_deck_houses || [];
      hDetails.forEach(hd => {
        const house = hd.house;
        if (!houseData[house]) {
          houseData[house] = {
            sas_est: [],
            aerc_raw: [],
            syn_net: [],
            expectedAmber: [],
            amberControl: [],
            creatureControl: [],
            effectivePower: []
          };
        }
        houseData[house].sas_est.push(hd.house_sas_estimate);
        houseData[house].aerc_raw.push(hd.aerc_raw_from_cards);
        houseData[house].syn_net.push(hd.synergy_net);
        houseData[house].expectedAmber.push(hd.expected_amber || 0);
        houseData[house].amberControl.push(hd.amber_control || 0);
        houseData[house].creatureControl.push(hd.creature_control || 0);
        houseData[house].effectivePower.push(hd.effective_power || 0);
      });
    });

    const housesSummary = {};
    Object.entries(houseData).forEach(([house, lists]) => {
      housesSummary[house] = {
        count: lists.sas_est.length,
        sas_est: getDynamicSummaryFromValues(lists.sas_est),
        aerc_raw: getDynamicSummaryFromValues(lists.aerc_raw),
        syn_net: getDynamicSummaryFromValues(lists.syn_net),
        expectedAmber_mean: mean(lists.expectedAmber),
        amberControl_mean: mean(lists.amberControl),
        creatureControl_mean: mean(lists.creatureControl),
        effectivePower_mean: mean(lists.effectivePower),
        sas_est_hist: getDynamicHistogramFromValues(lists.sas_est, 1)
      };
    });
    return housesSummary;
  }

  function getDynamicSummaryFromValues(values) {
    if (values.length === 0) return { mean: 0, median: 0, min: 0, max: 0, p50: 0, p75: 0, p90: 0, p95: 0, p99: 0, p99_9: 0 };
    const sorted = [...values].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, v) => acc + v, 0);
    const getPercentile = (p) => {
      const idx = Math.min(Math.floor((p / 100) * sorted.length), sorted.length - 1);
      return sorted[idx];
    };
    return {
      mean: sum / sorted.length,
      median: getPercentile(50),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: getPercentile(50),
      p75: getPercentile(75),
      p90: getPercentile(90),
      p95: getPercentile(95),
      p99: getPercentile(99),
      p99_9: getPercentile(99.9)
    };
  }

  function getDynamicHistogramFromValues(values, binWidth = 1) {
    if (values.length === 0) return [];
    const minVal = Math.floor(Math.min(...values));
    const maxVal = Math.ceil(Math.max(...values));
    const binsCount = Math.ceil((maxVal - minVal) / binWidth) + 1;
    const bins = Array.from({ length: binsCount }, (_, i) => ({
      x0: minVal + i * binWidth,
      x1: minVal + (i + 1) * binWidth,
      count: 0
    }));
    values.forEach(v => {
      const binIdx = Math.floor((v - minVal) / binWidth);
      if (binIdx >= 0 && binIdx < bins.length) {
        bins[binIdx].count++;
      }
    });
    return bins.filter(b => b.count > 0);
  }

  function mean(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((acc, v) => acc + v, 0) / arr.length;
  }

  // 9. Filter Action Listener (Async Handler)
  async function triggerFilterChange() {
    syncUiFromState();
    updateUrlParams();
    
    // Check if we need to query dynamic data from Supabase
    if (isDynamicMode()) {
      showLoadingCharts();
      await fetchFilteredDecksForCharts();
    }
    
    renderAllCharts();
  }

  // 10. Event Listeners Setup
  function setupEventListeners() {
    // Collection selector
    document.querySelectorAll('#collection-selector .pill-option').forEach(el => {
      el.addEventListener('click', () => {
        const col = el.getAttribute('data-collection');
        if (state.collections.includes(col)) {
          if (state.collections.length > 1) {
            state.collections = state.collections.filter(c => c !== col);
          }
        } else {
          state.collections.push(col);
        }
        triggerFilterChange();
      });
    });

    // Include House selector
    document.querySelectorAll('#include-houses-selector .pill-option').forEach(el => {
      el.addEventListener('click', () => {
        const house = el.getAttribute('data-house');
        if (state.includeHouses.includes(house)) {
          state.includeHouses = state.includeHouses.filter(h => h !== house);
        } else {
          state.includeHouses.push(house);
        }
        triggerFilterChange();
      });
    });

    // Mode dropdown
    document.getElementById('house-match-mode').addEventListener('change', (e) => {
      state.houseMatchMode = e.target.value;
      triggerFilterChange();
    });

    // Metric dropdown
    document.getElementById('metric-select').addEventListener('change', (e) => {
      state.metric = e.target.value;
      triggerFilterChange();
    });

    // Presets dropdown
    document.getElementById('top-preset-select').addEventListener('change', (e) => {
      state.topPreset = e.target.value;
      if (state.topPreset !== 'custom') {
        state.topPercent = parseFloat(state.topPreset);
      }
      triggerFilterChange();
    });

    // Top Percent Slider
    document.getElementById('top-percent-slider').addEventListener('input', (e) => {
      state.topPercent = parseFloat(e.target.value);
      document.getElementById('slider-value-display').textContent = `${state.topPercent.toFixed(1)}%`;
    });

    document.getElementById('top-percent-slider').addEventListener('change', (e) => {
      state.topPercent = parseFloat(e.target.value);
      triggerFilterChange();
    });

    // Scope dropdown
    const scopeEl = document.getElementById('ranking-scope');
    if (scopeEl) {
      scopeEl.addEventListener('change', (e) => {
        state.rankingScope = e.target.value;
        triggerFilterChange();
      });
    }

    // House metric selector inside houses tab
    document.getElementById('house-metric-selector').addEventListener('change', () => {
      renderHouses();
    });

    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.activeTab = btn.getAttribute('data-tab');
        syncUiFromState();
        updateUrlParams();
        renderAllCharts();
      });
    });

    // Load More button
    document.getElementById('load-more-btn').addEventListener('click', () => {
      fetchDecksFromSupabase();
    });
  }

  // 11. Startup sequence
  parseUrlParams();
  setupEventListeners();
  await loadAggregateData();
  await triggerFilterChange();
});
