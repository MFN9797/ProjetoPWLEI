// Referências aos elementos do HTML
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const grid = document.getElementById('character-grid');

// Elementos do Modal
const modal = document.getElementById('characterModal');
const closeModal = document.getElementById('closeModal');
const modalBody = document.getElementById('modalBody');

// Variável para guardar a lista de personagens exclusiva de One Piece
let onePieceCharacters = [];

// Referência à nova lista de sugestões
const suggestionsList = document.getElementById('searchSuggestions');

// Ouve o que o utilizador digita na barra em tempo real
searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();
    suggestionsList.innerHTML = ''; // Limpa sugestões antigas
    
    if (!query) {
        suggestionsList.style.display = 'none'; // Se estiver vazio, esconde a lista
        return;
    }

    // Procura personagens que tenham o texto escrito
    const filtered = onePieceCharacters.filter(char => 
        char.name.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
        suggestionsList.innerHTML = '<li style="color: var(--text-muted); justify-content: center;">Sem resultados...</li>';
        suggestionsList.style.display = 'block';
        return;
    }

    // Pega nos primeiros 6 resultados para não criar uma lista gigante
    filtered.slice(0, 6).forEach(char => {
        const li = document.createElement('li');
        li.innerHTML = `
            <img src="${char.images.jpg.image_url}" alt="${char.name}">
            <span>${char.name}</span>
        `;
        
        // Se o utilizador clicar nesta mini sugestão, abre logo a janela!
        li.onmousedown = () => { 
            openCharacterDetails(char.mal_id);
            searchInput.value = ''; // Limpa a barra
            suggestionsList.style.display = 'none'; // Esconde as sugestões
        };
        
        suggestionsList.appendChild(li);
    });

    suggestionsList.style.display = 'block'; // Mostra a lista
});

// Se o utilizador clicar fora da barra de pesquisa ou da lista, ela esconde-se
document.addEventListener('click', (e) => {
    if (e.target !== searchInput && e.target !== suggestionsList) {
        suggestionsList.style.display = 'none';
    }
});

// 1. Buscar a lista de personagens do Anime One Piece (ID 21)
async function fetchOnePieceRoster() {
    grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">A reunir a tripulação... (Isto pode demorar uns segundos)</p>';
    try {
        // Pedido ao endpoint específico do anime One Piece
        const response = await fetch('https://api.jikan.moe/v4/anime/21/characters');
        if (!response.ok) throw new Error('Erro de ligação');
        
        const data = await response.json();
        
        // A API devolve { character: {...}, role: "..." }. Vamos extrair só a personagem.
        onePieceCharacters = data.data.map(item => item.character);
        
        // Mostra os 12 primeiros como ecrã inicial
        renderCharacters(onePieceCharacters.slice(0, 12));
    } catch (error) {
        console.error(error);
        grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: red;">Não foi possível contactar a Grand Line.</p>';
    }
}

// 2. Desenhar os cartões no ecrã
function renderCharacters(charactersToRender) {
    grid.innerHTML = ''; // Limpa a grelha
    
    if (charactersToRender.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Personagem não encontrada nesta tripulação.</p>';
        return;
    }

    charactersToRender.forEach(char => {
        const card = document.createElement('div');
        card.className = 'card';
        // Adiciona o evento de clique a cada cartão
        card.onclick = () => openCharacterDetails(char.mal_id);
        
        card.innerHTML = `
            <img src="${char.images.jpg.image_url}" alt="${char.name}">
            <div class="card-info">
                <h2>${char.name}</h2>
                <p>Clica para ler a história</p>
            </div>
        `;
        grid.appendChild(card);
    });
}

// 3. Pesquisar localmente na lista do One Piece
function handleSearch() {
    const query = searchInput.value.toLowerCase().trim();
    if (!query) return; // Se estiver vazio, não faz nada
    
    // Filtra as personagens cujo nome inclui o que o utilizador escreveu
    const filtered = onePieceCharacters.filter(char => 
        char.name.toLowerCase().includes(query)
    );
    
    // Mostra até 12 resultados para não sobrecarregar o site
    renderCharacters(filtered.slice(0, 12));
}

// 4. Abrir os detalhes e buscar a história (Backstory)
async function openCharacterDetails(characterId) {
    // Mostra a janela com uma mensagem de loading
    modal.style.display = 'block';
    modalBody.innerHTML = '<p style="text-align:center;">A ler os Poneglyphs (A carregar história)...</p>';

    try {
        // Pedido à API para buscar a informação detalhada (full) da personagem
        const response = await fetch(`https://api.jikan.moe/v4/characters/${characterId}/full`);
        const data = await response.json();
        const char = data.data;

        // Verifica se a API tem o texto "about", caso contrário mete um texto padrão
        const historyText = char.about ? char.about : "História não disponível nos arquivos da Marinha.";

        // Constrói o HTML de dentro da janela
        modalBody.innerHTML = `
            <div class="modal-header">
                <img src="${char.images.jpg.image_url}" alt="${char.name}">
                <div>
                    <h2>${char.name}</h2>
                    <p><strong>Nome Original:</strong> ${char.name_kanji}</p>
                </div>
            </div>
            <hr style="border: 1px solid #333; margin-bottom: 20px;">
            <h3>História e Detalhes</h3>
            <p class="history-text">${historyText}</p>
        `;
    } catch (error) {
        modalBody.innerHTML = '<p style="color:red;">Erro ao ler os arquivos desta personagem.</p>';
    }
}

// Eventos de clique para pesquisar e fechar a janela
searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

closeModal.onclick = () => { modal.style.display = 'none'; };

// Fecha o modal se o utilizador clicar fora da caixa do conteúdo
window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
};

// Arranca o site carregando as personagens
fetchOnePieceRoster();