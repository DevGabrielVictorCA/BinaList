// VÁRIAVEIS
const campoTarefa = document.getElementById('campo-tarefa');
const enviarTarefaBtn = document.getElementById('enviar-tarefa-btn');
const cancelarBtn = document.getElementById('cancelar');

const createTaskForm = document.querySelector('.S-formulario');

const selectCategoria = document.getElementById('categorias');
const selectData = document.getElementById('data-tarefa');
const selectPrioridade = document.getElementById('prioridade');

const addFiltrosBtn = document.getElementById('add-filtros-input');
const filtragem = document.querySelector('.filtragem');

const cardTarefaDestaque = document.querySelector('.card-tarefa-destaque')
const listaDeTarefas = document.querySelector('.lista-de-tarefas');
const templateTarefa = document.querySelector('.template-tarefa');

let tarefaEmEdicao = null;

// ARRAYS E OBJETOS

const arrayTarefas = [];

const filtros = {
    categoria: 'mostrar-todas',
    data: 'mostrar-todas',
    prioridade: 'mostrar-todas',
    status: 'mostrar-todas'
};

const scoreTarefa = {
    Alta: 100,
    Media: 50,
    Baixa: 10
}

// FUNÇÕES

function pegarIndexTarefa(id){ return arrayTarefas.findIndex(tarefa => tarefa.id === id); }

function pegarDatas() {
    const formatar = d => d.toLocaleDateString('en-CA');

    const hojeDate = new Date();
    const hoje = formatar(hojeDate);

    const amanhaDate = new Date();
    amanhaDate.setDate(amanhaDate.getDate() + 1);
    const amanha = formatar(amanhaDate);

    const ontemDate = new Date();
    ontemDate.setDate(ontemDate.getDate() - 1);
    const ontem = formatar(ontemDate);

    return { hoje, amanha, ontem };
}

function pegarDataScore(dataTarefa){
    if(!dataTarefa) return 0;

    const {hoje, amanha} = pegarDatas()

    if(dataTarefa === hoje) return 30;
    if(dataTarefa === amanha) return 25;

    if(dataTarefa < hoje){
        const diasAtrasados = (new Date(hoje) - new Date(dataTarefa)) / (1000*60*60*24); // pega o dia de hoje - a data de lancamento e transforma em dias (por isso a conta)
        return 30 + (diasAtrasados * 5); // se for 1 dia, retornará 35
    }

    return 10; // datas alem de amanhã
}

function gerarTarefaScore(tarefa){ return((scoreTarefa[tarefa.prioridade] || 0) + pegarDataScore(tarefa.data)); }

function criarLiTarefa(tarefa, isDestaque = false){
    const clone = templateTarefa.content.cloneNode(true);

    const{hoje, amanha, ontem} = pegarDatas();

    const li = clone.querySelector('li');
    li.dataset.id = tarefa.id

    const checkbox = clone.querySelector('input[type="checkbox"]');
    checkbox.checked = tarefa.completo;

    const tarefaTitulo = clone.querySelector('.tarefa-titulo');
    tarefaTitulo.textContent = tarefa.titulo;

    const itemCategoria = clone.querySelector('.t-item-categoria');
    if(tarefa.categoria === '')itemCategoria.style.display = 'none'; 
    itemCategoria.textContent = tarefa.categoria;

    const itemData = clone.querySelector('.t-item-data');
    switch (tarefa.data){
        case hoje: itemData.textContent = 'Hoje'; break;
        case amanha: itemData.textContent = 'Amanhã'; break;
        case ontem: itemData.textContent = 'Ontem'; break;
        default: 
            const partes = tarefa.data.split('-');
            itemData.textContent = `${partes[2]}/${partes[1]}/${partes[0]}`; 
            break;
    } 

    const itemPrioridade = clone.querySelector('.t-item-prioridade');
    itemPrioridade.textContent = tarefa.prioridade;

    estilizarTasks(isDestaque, li, tarefa)

    return li;
}

function estilizarTasks(isDestaque, li, tarefa){
     if (isDestaque){
        li.classList.add('tarefa-destaque');
        li.classList.add('ativo');
    }

    if(tarefa.prioridade === 'Alta') li.classList.add('p-alta');
    if(tarefa.prioridade === 'Media') li.classList.add('p-media');
    if(tarefa.prioridade === 'Baixa') li.classList.add('p-baixa');
    if(tarefa.completo === true){
        li.classList.remove('p-alta', 'p-media', 'p-baixa');
        li.classList.add('p-concluido')
    }
}

function renderizarTarefaDestaque(){
    cardTarefaDestaque.innerHTML = '';
    
    const tarefasPendentes = arrayTarefas.filter (t => !t.completo);
    if(!tarefasPendentes.length){
        cardTarefaDestaque.innerHTML = '<p>Você concluiu todas as tarefas 🎉</p>';
        return;
    }
    
    const tarefaDestaque = [...tarefasPendentes].sort(
        (a, b) => gerarTarefaScore(b) - gerarTarefaScore(a)
    )[0]

    // console.log(`Tarefa: ${arrayTarefas[0].titulo} \nScore: ${gerarTarefaScore(arrayTarefas[0])}`) // Ver Score Individualmente
    
    const li = criarLiTarefa(tarefaDestaque, true);
    cardTarefaDestaque.appendChild(li)
}


function renderizarTarefas(array = arrayTarefas){
    listaDeTarefas.innerHTML = '';
    array.forEach(tarefa => { listaDeTarefas.appendChild(criarLiTarefa(tarefa)) });
    renderizarTarefaDestaque()
    lucide.createIcons();
}

function filtragemTarefas(){
    const { hoje, amanha } = pegarDatas();

    const filtrados = arrayTarefas.filter(tarefa => {

        const categoriaSelecionada =
            filtros.categoria === 'mostrar-todas' ||
            tarefa.categoria === filtros.categoria;

        const prioridadeSelecionada =
            filtros.prioridade === 'mostrar-todas' ||
            tarefa.prioridade === filtros.prioridade;
        
        let dataSelecionada = true;

        switch (filtros.data){
            case 'hoje': dataSelecionada = tarefa.data === hoje; break;
            case 'amanha': dataSelecionada = tarefa.data === amanha; break;
            case 'passadas': dataSelecionada = !!tarefa.data && tarefa.data < hoje; break;
            case 'mostrar-todas': dataSelecionada = true; break;
        }

        let statusSelecionado = true;

        switch (filtros.status){
            case 'concluidas': statusSelecionado = tarefa.completo === true; break;
            case 'pendentes': statusSelecionado = !tarefa.completo; break;
            case 'mostrar-todas': statusSelecionado = true; break;
        }

        return categoriaSelecionada && prioridadeSelecionada && dataSelecionada && statusSelecionado;
    });

    renderizarTarefas(filtrados);
}

function enviarTarefa(){
    const { hoje } = pegarDatas();
    if (!campoTarefa.value.trim()){ //.trim() retorna o valor completo sem espaços. EX: converte '   Olá   ' para 'Olá'.
        console.log('Digite um valor válido') 
        return;
    }

    if (tarefaEmEdicao !== null){ 
        const tarefa = arrayTarefas[tarefaEmEdicao];

        if(
            campoTarefa.value.trim() === tarefa.titulo &&
            selectCategoria.value === tarefa.categoria &&
            selectData.value === tarefa.data &&
            selectPrioridade.value === tarefa.prioridade
        ){
            console.log('Não houve edição');
            return;
        }

        tarefa.titulo = campoTarefa.value.trim();
        tarefa.categoria = selectCategoria.value;
        tarefa.data = selectData.value || hoje;
        tarefa.prioridade = selectPrioridade.value || 'Media';
    }
    else {
        const novaTarefa = {
            id: Date.now(),
            titulo: campoTarefa.value.trim(),
            completo: false,
            categoria: selectCategoria.value,
            data: selectData.value || hoje,
            prioridade: selectPrioridade.value || 'Media'
        }
        arrayTarefas.push(novaTarefa)
    }

    addFiltrosBtn.checked = false;
    
    limparCampos()
    atualizarUI()
}

function limparCampos() {
    addFiltrosBtn.checked = false;

    campoTarefa.value = '';
    selectCategoria.value = '';
    selectData.value = '';
    selectPrioridade.value = '';

    enviarTarefaBtn.textContent = 'Enviar';
    tarefaEmEdicao = null;
}

function cancelar(){
    limparCampos()
    createTaskForm.classList.remove('ativo');
}

function excluir(index){
    arrayTarefas.splice(index, 1);
    atualizarUI()
}

function editar(li, index){
    const tarefaTitulo = li.querySelector('.tarefa-titulo');

    addFiltrosBtn.checked = true;

    campoTarefa.value = tarefaTitulo.textContent;
    selectCategoria.value = arrayTarefas[index].categoria || '';
    selectData.value = arrayTarefas[index].data || '';
    selectPrioridade.value = arrayTarefas[index].prioridade || '';

    enviarTarefaBtn.textContent = 'Atualizar'
    tarefaEmEdicao = index;
    campoTarefa.focus();
}

function check (e, index){
    arrayTarefas[index].completo = e.target.checked;
    atualizarUI()
}

function exibirInformacoes(li){  
    const tarefas = listaDeTarefas.querySelectorAll('li');
    const jaAtivo = li.classList.contains('ativo');
    tarefas.forEach(tarefa => tarefa.classList.remove('ativo'));
    if(!jaAtivo) li.classList.add('ativo');
}

function acoesTarefas(e){
    const li = e.target.closest('li');
    const itemSelecionado = e.target.dataset.function;

    if (!li || !itemSelecionado) return;

    const idItem = Number(li.dataset.id);
    const indexItem = pegarIndexTarefa(idItem);
    
    if (indexItem === -1) return;
    
    switch (itemSelecionado){
        case 'check': check(e, indexItem); break;
        case 'info': exibirInformacoes(li); break;
        case 'editar': editar(li, indexItem); break;
        case 'excluir': excluir(indexItem); break;
    }
}

// FUNÇÕES DE ARMAZENAMENTO LOCAL

function salvarTarefasLocal(){ localStorage.setItem('tarefas', JSON.stringify(arrayTarefas)); }

function carregarTarefasLocal(){
    const tarefasSalvas = JSON.parse(localStorage.getItem('tarefas')) || [];
    arrayTarefas.length = 0;
    arrayTarefas.push(...tarefasSalvas);
}

function atualizarUI(){
    salvarTarefasLocal()
    filtragemTarefas()
}

// EVENTOS

enviarTarefaBtn.addEventListener('click', (e)=>{
    e.preventDefault()
    enviarTarefa()
})

cancelarBtn.addEventListener('click', cancelar)

listaDeTarefas.addEventListener('click', acoesTarefas)
cardTarefaDestaque.addEventListener('click', acoesTarefas)

filtragem.addEventListener('change', (e)=>{
    const tipo = e.target.dataset.exibir;
    if (!tipo) return;
    filtros[tipo] = e.target.value;
    filtragemTarefas();
})

campoTarefa.addEventListener('focus', () => {
    createTaskForm.classList.add('ativo');
    // console.log('ativo')
});

//LUCIDE ICONS

document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
});

// INICIALIZAÇÃO

carregarTarefasLocal();
filtragemTarefas()
campoTarefa.focus();

// console.log(arrayTarefas)