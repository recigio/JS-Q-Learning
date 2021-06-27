let parar = false;
let velocidade = 500;
let epsilon = 0.9;
let discountFactor = 0.9;
let learningRate = 0.9;
let numeroEpocas = 100;
let chart =null;
let objeto=[2,3];

$(document).ready(function (){

    $('#velocidadeText').html('Espera entre ações: '+$('#velocidade').val()+' milisegundos');

    let qValues = initGridWorld();
    let rewards = initRecompensas();
    const actions = ['up', 'right', 'down', 'left','stop']
    updateTable(qValues,rewards,5,0,0);

    $("#iniciar").click(async function (){

        try {

            const data = {
                labels: labels,
                datasets: [{
                    label: 'Tempo (milisegundos)',
                    backgroundColor: 'rgb(255, 99, 132)',
                    borderColor: 'rgb(255, 99, 132)',
                    data: [],
                },
                {
                        label: 'Número Passos',
                        backgroundColor: 'rgb(44,90,172)',
                        borderColor: 'rgb(33,67,173)',
                        data: [],
                    }
                ]
            };

            const config = {
                type: 'line',
                data,
                options: {}
            };

            if(chart){
                chart.destroy();
            }
            chart = new Chart(
                document.getElementById('myChart'),
                config
            );

            parar = false;
            velocidade = $('#velocidade').val();
            epsilon = $('#epsilon').val();
            discountFactor = $('#discountFactor').val();
            learningRate = $('#learningRate').val();
            numeroEpocas = $('#numeroEpocas').val();

            qValues = initGridWorld();
            rewards = initRecompensas();

            await train(qValues,rewards,actions);

        } catch (e){
            console.log(e);
            $("#log").html(e);
        }

    });

    $('#velocidade').change(function (){
        $('#velocidadeText').html('Espera entre ações: '+$('#velocidade').val()+' milisegundos');
    });

    $("#parar").click(function (){ parar = true; });
    const labels = [
    ];



});

//inicia o mundo
function initGridWorld(environment_rows = 6, environment_columns = 7){

    const q_values = [];

    for(let i = 0; i< environment_rows; i++){
        q_values[i]=[];
        for(let j=0; j<environment_columns;j++ ){
            q_values[i][j]=[];
            for(let k=0; k<2;k++ ){
                q_values[i][j][k]=[0,0,0,0,0];
            }
        }
    }

    return q_values;
}

//inicia recompensas
function initRecompensas(environment_rows = 6, environment_columns = 7){

    const rewards = [];

    for(let i = 0; i< environment_rows; i++){
        rewards[i]=[]
        for(let j=0; j<environment_columns;j++ ){
            rewards[i][j]=[];
            for(let k=0; k<2;k++ ){
                rewards[i][j][k]=-1;
            }


        }
    }

    rewards[0][2][1]=100;
    rewards[0][3][1]=100;
    rewards[0][4][1]=100;

    rewards[1][3][0]=-100;
    rewards[1][3][1]=-100;

    rewards[2][2][0]=30;
    rewards[2][4][0]=30;

    //primeira linha
    for(let j=0; j<environment_columns;j++ ){
        rewards[4][j]=[];
        for(let k=0; k<2;k++ ){
            rewards[4][j][k]=-100;
        }
    }

    rewards[4][2][0]=-1;
    rewards[4][2][1]=-1;

    rewards[5][6][0]=-100;
    rewards[5][6][1]=-100;

    return rewards;
}

function getReward(rewards,currentRowIndex, currentColumnIndex,k){
    return rewards[currentRowIndex][currentColumnIndex][k];
}

//funcoes de ajuda

function isTerminalState(rewards, currentRowIndex, currentColumnIndex,k){
    return rewards[objeto[0]][objeto[1]][k] === 100 || parar;
}

function getStarterLocation(){
    return [5,1];
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function getNextAction(qValues, currentRowIndex, currentColumnIndex,k, epsilon){
    if (Math.random() < epsilon){
        return indexOfMax(qValues[currentRowIndex][currentColumnIndex][k]);
    } else {
        return getRandomInt(0,5);
    }
}

function indexOfMax(arr) {
    if (arr.length === 0) {
        return -1;
    }

    let max = arr[0];
    let maxIndex = 0;

    for (var i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            maxIndex = i;
            max = arr[i];
        }
    }

    return maxIndex;
}

function getNextLocation(rewards, actions, currentRowIndex, currentColumnIndex,k, actionIndex, environment_rows = 5, environment_columns = 6){

    if(actions[actionIndex] === 'stop'){
        return [currentRowIndex, currentColumnIndex,k];
    }

    let new_row_index = currentRowIndex;
    let new_column_index = currentColumnIndex;

    let new_object= Object.assign({}, objeto);

    if (actions[actionIndex] === 'up' && currentRowIndex > 0){
        new_row_index -= 1;
        new_object[0] -=1;
    } else if(actions[actionIndex] === 'right' && currentColumnIndex < environment_columns - 1){
        new_column_index += 1;
        new_object[1] +=1;
    } else if(actions[actionIndex] === 'down' && currentRowIndex < environment_rows - 1){
        new_row_index += 1;
        new_object[0] +=1;
    } else if(actions[actionIndex] === 'left' && currentColumnIndex > 0){
        new_column_index -= 1
        new_object[1] -=1;
    }

    //checka se chegou ate o objeto
    if(rewards[new_row_index][new_column_index][k] === 30){
        return [new_row_index, new_column_index,1];

    //checka se vai esbarrar no objeto
    } else if (new_row_index === new_object[0] && new_column_index === new_object[1]) {
        return [currentRowIndex, currentColumnIndex,k];

    //checka se nao vai esbarrar na parede
    } else if (rewards[new_row_index][new_column_index][k] === -100 || (k===1 && rewards[new_object[0]][new_object[1]][k] === -100)) {
        return [currentRowIndex, currentColumnIndex,k];

    //senao avanca
    } else {
        if(k===1){
            objeto = new_object;
        }
        return [new_row_index, new_column_index,k];

    }

}

function updateTable(qValues, rewards, current_row, current_column,k, environment_columns=7,environment_rows=6){

    for(let i = 0; i< environment_rows; i++){
        for(let j=0; j<environment_columns;j++ ){

            let personagem = '<div></div>';
            if(current_row ===i && current_column === j){
                personagem = '<div class="personagem"></div>';
            }

            let objetoImage = '<div></div>';
            if(i === objeto[0] && j === objeto[1]){
                objetoImage = '<div class="objeto"></div>';
            }

            let background ='#fff';
            if (rewards[i][j][0] === 30) {
                background='#eadaa0';
            }

            let backgroundK ='#fff';
            if (rewards[i][j][1] === 100) {
                backgroundK='#eadaa0';
            }

            let backgroundF ='#eee';
            if (rewards[i][j][1] === 100) {
                backgroundF='#eadaa0';
            }

            $('#' + i + '-' + j).html(
                '<div class="item" style="background-color: '+background+'">' +
                    '<div class="item-up" style="background-color:' + calcColor(fixedValue(qValues[i][j][0][0])) + '">' + fixedValue(qValues[i][j][0][0]) + '</div>' +
                    '<div class="item-left" style="background-color:' + calcColor(fixedValue(qValues[i][j][0][3])) + '">' + fixedValue(qValues[i][j][0][3]) + '</div>' +
                    '<div class="item-center" style="background-color:' + calcColor(fixedValue(qValues[i][j][0][4])) + '">' + fixedValue(qValues[i][j][0][4]) + '</div>' +
                    '<div class="item-right" style="background-color:' + calcColor(fixedValue(qValues[i][j][0][1])) + '">' + fixedValue(qValues[i][j][0][1]) + '</div>' +
                    '<div class="item-down" style="background-color:' + calcColor(fixedValue(qValues[i][j][0][2])) + '">' + fixedValue(qValues[i][j][0][2]) + '</div>'
                    + personagem + ''
                    + objetoImage +
                '</div>'
            );

            $('#k' + i + '-' + j).html(
                '<div class="item"  style="background-color: '+backgroundK+'">' +
                    '<div class="item-up" style="background-color:' + calcColor(fixedValue(qValues[i][j][1][0])) + '">' + fixedValue(qValues[i][j][1][0]) + '</div>' +
                    '<div class="item-left" style="background-color:' + calcColor(fixedValue(qValues[i][j][1][3])) + '">' + fixedValue(qValues[i][j][1][3]) + '</div>' +
                    '<div class="item-center" style="background-color:' + calcColor(fixedValue(qValues[i][j][1][4])) + '">' + fixedValue(qValues[i][j][1][4]) + '</div>' +
                    '<div class="item-right" style="background-color:' + calcColor(fixedValue(qValues[i][j][1][1])) + '">' + fixedValue(qValues[i][j][1][1]) + '</div>' +
                    '<div class="item-down" style="background-color:' + calcColor(fixedValue(qValues[i][j][1][2])) + '">' + fixedValue(qValues[i][j][1][2]) + '</div>'
                    + personagem  + ''
                    + objetoImage +
                '</div>'
            );


            $('#f' + i + '-' + j).html(
                '<div class="item" style="background-color: '+backgroundF+'">'
                + personagem  + ''
                + objetoImage +
                '</div>'
            );

            if (rewards[i][j][0] === -100) {
                $('#' + i + '-' + j).html(
                    '<div class="bloco">-100</div>'
                );
            }
            if (rewards[i][j][1] === -100) {
                $('#k' + i + '-' + j).html(
                    '<div class="bloco">-100</div>'
                );
            }

            if (rewards[i][j][0] === -100) {
                $('#f' + i + '-' + j).html(
                    '<div class="bloco"></div>'
                );
            }
        }
    }
}

function fixedValue(val){
    return parseFloat(val).toFixed(2);
}

function calcColor(value){

    const grau = 255;
    const opacity = fixedValue(Math.abs(value)/100);
    if(grau ===0){
        return 'rgb(255,255,255,0)';
    }
    if(value > 0){
        return 'rgb(0, '+grau+', 0,'+opacity+')';
    } else {
        return  'rgb('+grau+', 0 , 0,'+opacity*3+')';
    }
}


//treinamento
async function train(qValues,rewards,actions){

    for(let episode=0; episode < numeroEpocas; episode++) {

        $("#log").html('Velocidade: '+velocidade+' - Rodando '+episode);

        const start = getStarterLocation();
        let rowIndex = start[0];
        let columnIndex = start[1];
        let k = 0;
        objeto = [2,3];

        let terminalState = isTerminalState(rewards, start[0], start[1],k);
        if(terminalState){
            return false;
        }

        await runEpisode(qValues,epsilon,actions,rewards,rowIndex,columnIndex,k,terminalState,discountFactor,learningRate,episode);

    }


}

function runEpisode(qValues,epsilon,actions,rewards,rowIndex,columnIndex,k,terminalState,discountFactor,learningRate,episode){

    velocidade = $('#velocidade').val();
    let passos = 0;

    return new Promise( resolve => {

        const startTime = new Date();

        const process = setInterval(function () {

            const actionIndex = getNextAction(qValues, rowIndex, columnIndex,k, epsilon);

            const oldRowIndex = rowIndex;
            const oldColumnIndex = columnIndex;

            const nextIndex = getNextLocation(rewards,actions, rowIndex, columnIndex,k, actionIndex);

            rowIndex = nextIndex[0];
            columnIndex = nextIndex[1];

            let reward =0;
            if(k===1){
                reward =rewards[objeto[0]][objeto[1]][k];
            } else {
                reward =rewards[rowIndex][columnIndex][k];
            }

            const oldQValue = qValues[oldRowIndex][oldColumnIndex][k][actionIndex];

            const maxValue = qValues[rowIndex][columnIndex][k].reduce(function (a, b) {
                return Math.max(a, b);
            });

            const temporalDifference = parseFloat(reward + (discountFactor * maxValue - oldQValue));
            const newQValue = parseFloat(oldQValue + (learningRate * temporalDifference));

            qValues[oldRowIndex][oldColumnIndex][k][actionIndex] = newQValue;

            k = nextIndex[2];
            terminalState = isTerminalState(rewards, rowIndex, columnIndex,k);

            const endTime = new Date();
            const timeDiff = endTime - startTime;

            if (terminalState) {

                clearInterval(process);
                $("#log").html('Terminado ' + episode+ ' tempo: '+timeDiff);

                const data = chart.data;
                data.labels.push(episode);
                data.datasets[0].data.push(timeDiff);
                data.datasets[1].data.push(passos);
                chart.update();

                resolve(true);
            }

            $("#log").html('Rodando: '+episode+ ' / Tempo (ms): '+timeDiff);

            updateTable(qValues,rewards,rowIndex,columnIndex,k);

            $("#log2").html('QValue:' + newQValue + ' => oldQValue: '+fixedValue(oldQValue)+' + learningRate: '+fixedValue(learningRate)+' * ( reward:' + fixedValue(reward) + ' (discountFactor:' + fixedValue(discountFactor) + '* maxValue:' + fixedValue(maxValue) + '- oldQValue:' + fixedValue(oldQValue) + ') )');
            passos++;


        }, velocidade);

    });

}







