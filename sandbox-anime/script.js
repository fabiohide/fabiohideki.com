// Script de Geracao e Interacao do Componente Poligonal SVG com Anime.js e Motion Path

document.addEventListener('DOMContentLoaded', () => {
    // Lista de 24 Jogadores Brasileiros Variados (Nomes de ate 12 caracteres)
    const samplePlayers = [
        "Fabio", "Pedro", "Lucas", "Ana", "Bruno", "Clara", 
        "Diego", "Elena", "Fernando", "Gabriela", "Hugo", "Isabela", 
        "Joao", "Karen", "Leonardo", "Mariana", "Otavio", "Rafaela", 
        "Rodrigo", "Sofia", "Thiago", "Vanessa", "Vinicius", "Yasmim"
    ];

    // Elementos DOM - Filtro Colapsavel no Topo
    const filterToggleBtn = document.getElementById('filter-toggle-btn');
    const filterChipsContainer = document.getElementById('filter-chips-container');
    const filterCount = document.getElementById('filter-count');
    const toggleIndicator = document.getElementById('toggle-indicator');

    // Elementos DOM - Estrutura
    const numPointsInput = document.getElementById('num-points');
    const numPointsVal = document.getElementById('num-points-val');
    const polygonRadiusInput = document.getElementById('polygon-radius');
    const polygonRadiusVal = document.getElementById('polygon-radius-val');
    const connectModeSelect = document.getElementById('connect-mode');

    // Elementos DOM - Motion Path
    const enableMotionLoopInput = document.getElementById('enable-motion-loop');
    const motionSpeedInput = document.getElementById('motion-speed');
    const motionSpeedVal = document.getElementById('motion-speed-val');
    const colorParticleInput = document.getElementById('color-particle');
    const motionParticle = document.getElementById('motion-particle');

    // Elementos DOM - Estilo dos Pontos e Rotulos
    const pointSizeInput = document.getElementById('point-size');
    const pointSizeVal = document.getElementById('point-size-val');
    const colorPointBaseInput = document.getElementById('color-point-base');
    const colorPointHoverInput = document.getElementById('color-point-hover');
    const colorPointSelectedInput = document.getElementById('color-point-selected');

    const seedPosSelect = document.getElementById('seed-pos-select');
    const showPlayerNameInput = document.getElementById('show-player-name');
    const fontSizeLabelsInput = document.getElementById('font-size-labels');
    const fontSizeVal = document.getElementById('font-size-val');

    // Elementos DOM - Badge de Legibilidade
    const labelBorderRadiusInput = document.getElementById('label-border-radius');
    const radiusVal = document.getElementById('radius-val');
    const labelStrokeWidthInput = document.getElementById('label-stroke-width');
    const labelStrokeVal = document.getElementById('label-stroke-val');

    const colorTextExternalInput = document.getElementById('color-text-external');
    const colorLabelBgInput = document.getElementById('color-label-bg');
    const colorLabelStrokeInput = document.getElementById('color-label-stroke');

    // Elementos DOM - Linhas
    const edgeWidthInput = document.getElementById('edge-width');
    const edgeWidthVal = document.getElementById('edge-width-val');
    const colorEdgeNeutralInput = document.getElementById('color-edge-neutral');
    const colorEdgeActiveInput = document.getElementById('color-edge-active');
    const edgeOpacityNeutralInput = document.getElementById('edge-opacity-neutral');
    const edgeOpacityVal = document.getElementById('edge-opacity-val');

    const edgesGroup = document.getElementById('edges-group');
    const nodesGroup = document.getElementById('nodes-group');

    // Card de Informacoes
    const infoSeed = document.getElementById('info-seed');
    const infoName = document.getElementById('info-name');
    const infoDesc = document.getElementById('info-desc');
    const infoStats = document.getElementById('info-stats');
    const statMatches = document.getElementById('stat-matches');
    const statOpponents = document.getElementById('stat-opponents');

    // Modal de Exportacao
    const btnExportSvg = document.getElementById('btn-export-svg');
    const btnExportJson = document.getElementById('btn-export-json');
    const codeModal = document.getElementById('code-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalCode = document.getElementById('modal-code');
    const btnModalClose = document.getElementById('btn-modal-close');
    const btnCopyCode = document.getElementById('btn-copy-code');

    // Estado Atual do Componente
    let state = {
        selectedNodeId: null,
        hoveredNodeId: null,
        points: [],
        edges: []
    };

    // Controle de Animacao Motion Path
    let activeMotionAnimation = null;
    let currentMatchIndex = 0;

    // Centro do SVG (viewBox 600x600)
    const CX = 300;
    const CY = 300;

    // --- 1. CALCULOS GEOMETRICOS ---
    function calculatePoints(numPoints, radius) {
        const points = [];
        for (let i = 0; i < numPoints; i++) {
            const angle = (2 * Math.PI * i / numPoints) - (Math.PI / 2);
            const x = CX + radius * Math.cos(angle);
            const y = CY + radius * Math.sin(angle);
            const seedNum = String(i + 1).padStart(2, '0');
            
            points.push({
                id: i,
                seed: `#${seedNum}`,
                name: samplePlayers[i] || `Jogador ${i + 1}`,
                x: x,
                y: y
            });
        }
        return points;
    }

    function calculateEdges(points, mode) {
        const edges = [];
        const n = points.length;

        if (mode === 'perimeter') {
            for (let i = 0; i < n; i++) {
                const targetIdx = (i + 1) % n;
                edges.push({
                    id: `edge-${i}-${targetIdx}`,
                    source: i,
                    target: targetIdx,
                    isPerimeter: true
                });
            }
        } else if (mode === 'all-matches') {
            for (let i = 0; i < n; i++) {
                for (let j = i + 1; j < n; j++) {
                    const isPerimeter = (j === i + 1) || (i === 0 && j === n - 1);
                    edges.push({
                        id: `edge-${i}-${j}`,
                        source: i,
                        target: j,
                        isPerimeter: isPerimeter
                    });
                }
            }
        }
        return edges;
    }

    // --- 2. RENDERIZACAO SVG E FILTRO ---
    function renderComponent() {
        stopMotionPathLoop();

        const numPoints = parseInt(numPointsInput.value, 10);
        const radius = parseInt(polygonRadiusInput.value, 10);
        const mode = connectModeSelect.value;
        const pointSize = parseInt(pointSizeInput.value, 10);
        const edgeWidth = parseInt(edgeWidthInput.value, 10);
        const colorPointBase = colorPointBaseInput.value;
        const colorPointSelected = colorPointSelectedInput.value;
        const colorEdgeNeutral = colorEdgeNeutralInput.value;
        const edgeOpacityNeutral = parseFloat(edgeOpacityNeutralInput.value);

        const seedPos = seedPosSelect.value;
        const showPlayerName = showPlayerNameInput.checked;
        const fontSize = parseInt(fontSizeLabelsInput.value, 10);
        const labelBorderRadius = parseInt(labelBorderRadiusInput.value, 10);
        const labelStrokeWidth = parseInt(labelStrokeWidthInput.value, 10);
        const colorTextExternal = colorTextExternalInput.value;
        const colorLabelBg = colorLabelBgInput.value;
        const colorLabelStroke = colorLabelStrokeInput.value;

        if (state.selectedNodeId !== null && state.selectedNodeId >= numPoints) {
            state.selectedNodeId = null;
            updateInfoCard(null);
        }

        state.points = calculatePoints(numPoints, radius);
        state.edges = calculateEdges(state.points, mode);

        edgesGroup.innerHTML = '';
        nodesGroup.innerHTML = '';

        // A. Renderizar Vértices / Linhas (Arestas)
        state.edges.forEach(edge => {
            const p1 = state.points[edge.source];
            const p2 = state.points[edge.target];

            if (!p1 || !p2) return;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('id', edge.id);
            line.setAttribute('x1', p1.x);
            line.setAttribute('y1', p1.y);
            line.setAttribute('x2', p2.x);
            line.setAttribute('y2', p2.y);
            line.setAttribute('stroke', colorEdgeNeutral);
            line.setAttribute('stroke-width', edgeWidth);
            
            const initialOpacity = edge.isPerimeter ? edgeOpacityNeutral : 0;
            line.setAttribute('opacity', initialOpacity);
            line.setAttribute('class', 'svg-edge');

            line.dataset.source = edge.source;
            line.dataset.target = edge.target;
            line.dataset.isPerimeter = edge.isPerimeter ? 'true' : 'false';

            edgesGroup.appendChild(line);
            edge.element = line;
        });

        // B. Renderizar Pontos / Seeds (Nos)
        state.points.forEach(p => {
            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'svg-node');
            g.setAttribute('id', `node-${p.id}`);
            g.setAttribute('transform', `translate(${p.x}, ${p.y})`);
            g.dataset.id = p.id;

            // Circulo Base
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('r', pointSize);
            circle.setAttribute('fill', p.id === state.selectedNodeId ? colorPointSelected : colorPointBase);
            circle.setAttribute('stroke', colorPointSelected);
            circle.setAttribute('stroke-width', '2');
            circle.setAttribute('class', 'svg-node-circle');
            g.appendChild(circle);

            // 1. Numeraçao da Seed DENTRO do Ponto
            if (seedPos === 'inside') {
                const textInside = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                textInside.setAttribute('class', 'svg-node-text');
                textInside.setAttribute('fill', p.id === state.selectedNodeId ? '#ffffff' : '#1e293b');
                textInside.setAttribute('font-size', `${Math.max(9, pointSize * 0.85)}px`);
                textInside.setAttribute('font-weight', '700');
                textInside.setAttribute('text-anchor', 'middle');
                textInside.setAttribute('dy', '0.5px');
                textInside.textContent = p.seed;
                g.appendChild(textInside);
            }

            // 2. Rotulos no Lado Direito do Ponto
            const hasRightSeed = (seedPos === 'right');
            const hasRightName = showPlayerName;

            if (hasRightSeed || hasRightName) {
                const offsetRight = pointSize + 10;
                
                const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                labelGroup.setAttribute('class', 'svg-label-group');

                const textRight = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                textRight.setAttribute('x', offsetRight);
                textRight.setAttribute('y', '0.5px');
                textRight.setAttribute('font-size', `${fontSize}px`);
                textRight.setAttribute('dominant-baseline', 'central');
                textRight.setAttribute('text-anchor', 'start');
                textRight.setAttribute('pointer-events', 'none');
                textRight.setAttribute('fill', colorTextExternal);

                // Slot 1: Numero da Seed
                if (hasRightSeed) {
                    const spanSeed = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                    spanSeed.setAttribute('font-weight', '700');
                    spanSeed.setAttribute('fill', colorPointSelectedInput.value);
                    spanSeed.textContent = p.seed;
                    textRight.appendChild(spanSeed);
                }

                // Slot 2: Nome do Jogador
                if (hasRightName) {
                    const spanName = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                    spanName.setAttribute('font-weight', '500');
                    if (hasRightSeed) {
                        spanName.setAttribute('dx', '6');
                    }
                    spanName.textContent = p.name;
                    textRight.appendChild(spanName);
                }

                labelGroup.appendChild(textRight);
                g.appendChild(labelGroup);

                nodesGroup.appendChild(g);

                try {
                    const bbox = textRight.getBBox();
                    if (bbox.width > 0) {
                        const padX = 6;
                        const padY = 3;
                        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                        rect.setAttribute('x', bbox.x - padX);
                        rect.setAttribute('y', bbox.y - padY);
                        rect.setAttribute('width', bbox.width + (padX * 2));
                        rect.setAttribute('height', bbox.height + (padY * 2));
                        rect.setAttribute('rx', labelBorderRadius);
                        rect.setAttribute('ry', labelBorderRadius);
                        rect.setAttribute('fill', colorLabelBg);
                        rect.setAttribute('stroke', colorLabelStroke);
                        rect.setAttribute('stroke-width', labelStrokeWidth);
                        rect.setAttribute('class', 'svg-label-bg');
                        labelGroup.insertBefore(rect, textRight);
                    }
                } catch (e) {
                    // Fallback silencioso
                }
            } else {
                nodesGroup.appendChild(g);
            }

            // Eventos de Interacao
            g.addEventListener('mouseenter', () => handleNodeHover(p.id));
            g.addEventListener('mouseleave', () => handleNodeLeave());
            g.addEventListener('click', () => handleNodeClick(p.id));
        });

        renderPlayerFilterChips();

        // Aplicar destaque e iniciar loop de motion path se houver ponto selecionado
        if (state.selectedNodeId !== null && state.selectedNodeId < numPoints) {
            highlightNode(state.selectedNodeId);
            if (enableMotionLoopInput.checked) {
                startMotionPathLoop(state.selectedNodeId);
            }
        } else if (state.hoveredNodeId !== null && state.hoveredNodeId < numPoints) {
            highlightNode(state.hoveredNodeId);
        }
    }

    function renderPlayerFilterChips() {
        filterCount.textContent = state.points.length;
        filterChipsContainer.innerHTML = '';

        state.points.forEach(p => {
            const chip = document.createElement('button');
            chip.setAttribute('class', `filter-chip ${state.selectedNodeId === p.id ? 'active' : ''}`);
            chip.setAttribute('type', 'button');
            
            chip.innerHTML = `<span class="chip-seed">${p.seed}</span> <span>${p.name}</span>`;

            chip.addEventListener('click', (e) => {
                e.stopPropagation();
                handleNodeClick(p.id);
            });

            chip.addEventListener('mouseenter', () => {
                if (state.selectedNodeId === null) {
                    highlightNode(p.id);
                }
            });

            chip.addEventListener('mouseleave', () => {
                if (state.selectedNodeId === null) {
                    resetHighlights();
                }
            });

            filterChipsContainer.appendChild(chip);
        });
    }

    // --- 3. ANIMACAO MOTION PATH EM LOOP (Vértice por Vértice: Vai e Volta) ---
    function startMotionPathLoop(activeId) {
        stopMotionPathLoop();

        if (!enableMotionLoopInput.checked) return;

        const connectedEdges = state.edges.filter(e => e.source === activeId || e.target === activeId);
        if (connectedEdges.length === 0) return;

        motionParticle.setAttribute('fill', colorParticleInput.value);
        motionParticle.style.opacity = '1';
        currentMatchIndex = 0;

        function animateNextMatchEdge() {
            if (state.selectedNodeId !== activeId) {
                stopMotionPathLoop();
                return;
            }

            const edge = connectedEdges[currentMatchIndex % connectedEdges.length];
            const sourcePoint = state.points[edge.source];
            const targetPoint = state.points[edge.target];

            // Garantir que a viagem comeca sempre no jogador selecionado (pStart) e vai ate o oponente (pEnd)
            let pStart = sourcePoint;
            let pEnd = targetPoint;
            if (edge.target === activeId) {
                pStart = targetPoint;
                pEnd = sourcePoint;
            }

            // Criar caminho dinamico SVG para o anime.path
            let motionPathElem = document.getElementById('active-motion-path');
            if (!motionPathElem) {
                motionPathElem = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                motionPathElem.setAttribute('id', 'active-motion-path');
                motionPathElem.setAttribute('fill', 'none');
                motionPathElem.setAttribute('stroke', 'none');
                edgesGroup.appendChild(motionPathElem);
            }
            motionPathElem.setAttribute('d', `M ${pStart.x} ${pStart.y} L ${pEnd.x} ${pEnd.y}`);

            // Destacar o vertice da partida atual
            const line = edge.element;
            if (line) {
                line.setAttribute('stroke', colorEdgeActiveInput.value);
                line.setAttribute('stroke-width', parseInt(edgeWidthInput.value, 10) + 3);
                line.setAttribute('opacity', '1');
            }

            const pathTrack = anime.path(motionPathElem);
            const duration = parseInt(motionSpeedInput.value, 10);

            // Anime.js Motion Path: Vai ate o oponente e VOLTA (direction: alternate, loop: 2)
            activeMotionAnimation = anime({
                targets: motionParticle,
                translateX: pathTrack('x'),
                translateY: pathTrack('y'),
                easing: 'easeInOutQuad',
                duration: duration,
                direction: 'alternate',
                loop: 2, // 1 ciclo completo de ida e volta (2 viagens)
                complete: () => {
                    // Ao concluir o vai e volta no vertice atual:
                    // Reseta o vertice anterior e avanca para a proxima partida em loop
                    currentMatchIndex++;
                    if (state.selectedNodeId === activeId && enableMotionLoopInput.checked) {
                        animateNextMatchEdge();
                    } else {
                        stopMotionPathLoop();
                    }
                }
            });
        }

        animateNextMatchEdge();
    }

    function stopMotionPathLoop() {
        if (activeMotionAnimation) {
            activeMotionAnimation.pause();
            activeMotionAnimation = null;
        }
        if (motionParticle) {
            motionParticle.style.opacity = '0';
        }
    }

    // --- 4. INTERATIVIDADE DO CANVA E DESTAQUES ---
    function handleNodeHover(nodeId) {
        state.hoveredNodeId = nodeId;
        if (state.selectedNodeId === null) {
            highlightNode(nodeId);
        }
    }

    function handleNodeLeave() {
        state.hoveredNodeId = null;
        if (state.selectedNodeId === null) {
            resetHighlights();
        } else {
            highlightNode(state.selectedNodeId);
        }
    }

    function handleNodeClick(nodeId) {
        if (state.selectedNodeId === nodeId) {
            state.selectedNodeId = null;
            stopMotionPathLoop();
            resetHighlights();
            updateInfoCard(null);
        } else {
            state.selectedNodeId = nodeId;
            highlightNode(nodeId);
            updateInfoCard(state.points[nodeId]);
            startMotionPathLoop(nodeId);
        }
        renderPlayerFilterChips();
    }

    function highlightNode(activeId) {
        const colorPointHover = colorPointHoverInput.value;
        const colorPointSelected = colorPointSelectedInput.value;
        const colorEdgeActive = colorEdgeActiveInput.value;
        const colorEdgeNeutral = colorEdgeNeutralInput.value;
        const edgeOpacityNeutral = parseFloat(edgeOpacityNeutralInput.value);
        const edgeWidth = parseInt(edgeWidthInput.value, 10);
        const pointSize = parseInt(pointSizeInput.value, 10);

        state.points.forEach(p => {
            const nodeElem = document.getElementById(`node-${p.id}`);
            const circle = nodeElem ? nodeElem.querySelector('circle') : null;
            const labelBg = nodeElem ? nodeElem.querySelector('.svg-label-bg') : null;

            if (!circle) return;

            if (p.id === activeId) {
                circle.setAttribute('fill', state.selectedNodeId === activeId ? colorPointSelected : colorPointHover);
                circle.setAttribute('filter', 'url(#glow)');
                
                anime({
                    targets: circle,
                    r: pointSize * 1.4,
                    duration: 300,
                    easing: 'easeOutElastic(1, .6)'
                });

                if (labelBg) {
                    labelBg.setAttribute('stroke', colorPointSelected);
                }
            } else {
                circle.setAttribute('fill', colorPointBaseInput.value);
                circle.removeAttribute('filter');
                
                anime({
                    targets: circle,
                    r: pointSize,
                    duration: 200,
                    easing: 'easeOutQuad'
                });

                if (labelBg) {
                    labelBg.setAttribute('stroke', colorLabelStrokeInput.value);
                }
            }
        });

        // B. Destacar Vértices/Linhas Conexas ao Ponto Selecionado
        state.edges.forEach(edge => {
            const isConnected = edge.source === activeId || edge.target === activeId;
            const line = edge.element;

            if (!line) return;

            if (isConnected) {
                line.setAttribute('stroke', colorEdgeActive);
                line.setAttribute('stroke-width', edgeWidth + 2);
                line.setAttribute('opacity', '1');
            } else {
                if (edge.isPerimeter) {
                    line.setAttribute('stroke', colorEdgeNeutral);
                    line.setAttribute('stroke-width', edgeWidth);
                    line.setAttribute('opacity', edgeOpacityNeutral * 0.4);
                } else {
                    line.setAttribute('opacity', '0');
                }
            }
        });
    }

    function resetHighlights() {
        stopMotionPathLoop();

        const colorEdgeNeutral = colorEdgeNeutralInput.value;
        const edgeOpacityNeutral = parseFloat(edgeOpacityNeutralInput.value);
        const edgeWidth = parseInt(edgeWidthInput.value, 10);
        const colorPointBase = colorPointBaseInput.value;
        const pointSize = parseInt(pointSizeInput.value, 10);

        state.points.forEach(p => {
            const nodeElem = document.getElementById(`node-${p.id}`);
            const circle = nodeElem ? nodeElem.querySelector('circle') : null;
            const labelBg = nodeElem ? nodeElem.querySelector('.svg-label-bg') : null;

            if (circle) {
                circle.setAttribute('fill', colorPointBase);
                circle.removeAttribute('filter');

                anime({
                    targets: circle,
                    r: pointSize,
                    duration: 200,
                    easing: 'easeOutQuad'
                });
            }

            if (labelBg) {
                labelBg.setAttribute('stroke', colorLabelStrokeInput.value);
            }
        });

        state.edges.forEach(edge => {
            const line = edge.element;
            if (line) {
                line.setAttribute('stroke', colorEdgeNeutral);
                line.setAttribute('stroke-width', edgeWidth);
                line.setAttribute('opacity', edge.isPerimeter ? edgeOpacityNeutral : 0);
            }
        });
    }

    function updateInfoCard(point) {
        if (!point) {
            infoSeed.textContent = '#--';
            infoName.textContent = 'Selecione um Jogador';
            infoDesc.textContent = 'Clique em qualquer ponto (seed) do poligono ou use o filtro no topo para visualizar a simulacao de partidas via Motion Path em loop.';
            infoStats.style.display = 'none';
            return;
        }

        const connectedMatches = state.edges.filter(e => e.source === point.id || e.target === point.id);

        infoSeed.textContent = point.seed;
        infoName.textContent = point.name;
        infoDesc.textContent = `Jogador Seed ${point.seed} (${point.name}) com conexoes e animacao de partida via Motion Path em loop.`;
        statMatches.textContent = connectedMatches.length;
        statOpponents.textContent = connectedMatches.length;
        infoStats.style.display = 'flex';
    }

    // --- 5. VINCULACAO DOS EVENTOS DOS SLIDERS E CONTROLES ---
    function setupEventListeners() {
        // Toggle do Filtro Colapsavel
        filterToggleBtn.addEventListener('click', () => {
            const isHidden = filterChipsContainer.style.display === 'none';
            filterChipsContainer.style.display = isHidden ? 'flex' : 'none';
            toggleIndicator.textContent = isHidden ? '-' : '+';
            filterToggleBtn.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
        });

        // Controles do Motion Path
        enableMotionLoopInput.addEventListener('change', () => {
            if (state.selectedNodeId !== null) {
                if (enableMotionLoopInput.checked) {
                    startMotionPathLoop(state.selectedNodeId);
                } else {
                    stopMotionPathLoop();
                }
            }
        });

        motionSpeedInput.addEventListener('input', () => {
            motionSpeedVal.textContent = motionSpeedInput.value;
        });

        colorParticleInput.addEventListener('input', () => {
            motionParticle.setAttribute('fill', colorParticleInput.value);
        });

        const inputs = [
            numPointsInput, polygonRadiusInput, pointSizeInput,
            colorPointBaseInput, colorPointHoverInput, colorPointSelectedInput,
            fontSizeLabelsInput, labelBorderRadiusInput, labelStrokeWidthInput,
            colorTextExternalInput, colorLabelBgInput, colorLabelStrokeInput,
            edgeWidthInput, colorEdgeNeutralInput, colorEdgeActiveInput,
            edgeOpacityNeutralInput
        ];

        inputs.forEach(input => {
            input.addEventListener('input', () => {
                updateLabels();
                renderComponent();
            });
            input.addEventListener('change', () => {
                updateLabels();
                renderComponent();
            });
        });

        seedPosSelect.addEventListener('change', renderComponent);
        showPlayerNameInput.addEventListener('change', renderComponent);
        connectModeSelect.addEventListener('change', renderComponent);
    }

    function updateLabels() {
        numPointsVal.textContent = numPointsInput.value;
        polygonRadiusVal.textContent = polygonRadiusInput.value;
        pointSizeVal.textContent = pointSizeInput.value;
        fontSizeVal.textContent = fontSizeLabelsInput.value;
        radiusVal.textContent = labelBorderRadiusInput.value;
        labelStrokeVal.textContent = labelStrokeWidthInput.value;
        edgeWidthVal.textContent = edgeWidthInput.value;
        edgeOpacityVal.textContent = edgeOpacityNeutralInput.value;
        motionSpeedVal.textContent = motionSpeedInput.value;
    }

    // --- 6. EXPORTACAO DE CODIGO ---
    btnExportSvg.addEventListener('click', () => {
        const svgClone = document.getElementById('polygon-svg').cloneNode(true);
        svgClone.removeAttribute('id');
        
        modalTitle.textContent = 'Codigo SVG Standalone';
        modalCode.value = svgClone.outerHTML;
        codeModal.style.display = 'flex';
    });

    btnExportJson.addEventListener('click', () => {
        const config = {
            numPoints: parseInt(numPointsInput.value, 10),
            radius: parseInt(polygonRadiusInput.value, 10),
            connectMode: connectModeSelect.value,
            motionPath: {
                enabled: enableMotionLoopInput.checked,
                speedMs: parseInt(motionSpeedInput.value, 10),
                particleColor: colorParticleInput.value
            },
            pointStyle: {
                size: parseInt(pointSizeInput.value, 10),
                colorBase: colorPointBaseInput.value,
                colorHover: colorPointHoverInput.value,
                colorSelected: colorPointSelectedInput.value
            },
            labelStyle: {
                seedPosition: seedPosSelect.value,
                showPlayerName: showPlayerNameInput.checked,
                fontSize: parseInt(fontSizeLabelsInput.value, 10),
                borderRadius: parseInt(labelBorderRadiusInput.value, 10),
                strokeWidth: parseInt(labelStrokeWidthInput.value, 10),
                colorTextExternal: colorTextExternalInput.value,
                colorLabelBg: colorLabelBgInput.value,
                colorLabelStroke: colorLabelStrokeInput.value
            },
            edgeStyle: {
                width: parseInt(edgeWidthInput.value, 10),
                colorNeutral: colorEdgeNeutralInput.value,
                colorActive: colorEdgeActiveInput.value,
                opacityNeutral: parseFloat(edgeOpacityNeutralInput.value)
            },
            pointsData: state.points.map(p => ({ seed: p.seed, name: p.name }))
        };

        modalTitle.textContent = 'Configuracao JSON do Componente';
        modalCode.value = JSON.stringify(config, null, 2);
        codeModal.style.display = 'flex';
    });

    btnModalClose.addEventListener('click', () => {
        codeModal.style.display = 'none';
    });

    btnCopyCode.addEventListener('click', () => {
        modalCode.select();
        document.execCommand('copy');
        btnCopyCode.textContent = 'Copiado!';
        setTimeout(() => {
            btnCopyCode.textContent = 'Copiar Codigo';
        }, 2000);
    });

    // --- INICIALIZACAO COMPLETA ---
    setupEventListeners();
    updateLabels();
    renderComponent();
});
