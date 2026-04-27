import { exit } from 'process'
import readline from 'readline/promises'

let game = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
]

const symbols = {
    '1': 'x',
    '0': ' ',
    '-1': 'o'
}
const sides = {
    'X': 1,
    'O': -1
}

function displayGame() {
    game.forEach(row => {
        console.log(row.map(cell => symbols[cell]).join('|'));
    });
}

function hasEnded(state) { // -2 = not ended, -1 = O wins, 0 = draw, 1 = X wins

    for (let r = 0; r < 3; r++) {
        if (state[r][0] != 0 && state[r][0] == state[r][1] && state[r][1] == state[r][2]) {
            return state[r][0]
        }
    }
    for (let c = 0; c < 3; c++) {
        if (state[0][c] != 0 && state[0][c] == state[1][c] && state[1][c] == state[2][c]) {
            return state[0][c]
        }
    }

    if (state[0][0] != 0 && state[0][0] == state[1][1] && state[1][1] == state[2][2]) {
        return state[0][0]
    } else if (state[0][2] != 0 && state[0][2] == state[1][1] && state[1][1] == state[2][0]) {
        return state[0][2]
    }
    
    if (!state.flat().includes(0)) {
        return 0
    } else {
        return -2
    }
}

function checkMove(move) { // -1 = error, 0 = invalid, 1 = valid
    if (/^[1-3]{2}$/.test(move)) {
        let row = parseInt(move.charAt(0)) - 1
        let col = parseInt(move.charAt(1)) - 1
        if (game[row][col] == 0) {
            return [1, row, col]
        } else {
            return [0, row, col]
        }
    } else {
        return [-1]
    }
}

function doMove(state, turn, row, col) {
    const newState = structuredClone(state)
    newState[row][col] = turn
    return newState
}

function actions(state) {
    let actions_list = []
    for (let i = 0; i < state.length; i++) {
        for (let j = 0; j < state[i].length; j++) {
            if (state[i][j] == 0) {
                actions_list.push([i, j])
            }
        }
    }
    return actions_list
}

function think(state, turn) {
    const stateResult = hasEnded(state)
    if (stateResult != -2) {
        return [stateResult, -1, -1]
    }

    let actions_list = actions(state)
    let action_i = 0
    let action_value = turn * -1 * Infinity
    for (let a = 0; a < actions_list.length; a++) {
        const nodeState = doMove(state, turn, actions_list[a][0], actions_list[a][1])
        const nodeVal = think(nodeState, turn * -1)
        if (turn == 1 && nodeVal[0] > action_value) {
            action_value = nodeVal[0]
            action_i = a
        } else if (turn == -1 && nodeVal[0] < action_value) {
            action_value = nodeVal[0]
            action_i = a
        }
    }

    return [action_value, actions_list[action_i][0], actions_list[action_i][1]]
}


let turn = 1
let turns_played = 0

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

const option = (await rl.question('Choose your side [x/o]: ')).toUpperCase()
if (!['X', 'O'].includes(option)) {
    console.log("invalid option")
    exit(1)
}

const playerSide = sides[option]
const AISide = playerSide * -1

displayGame()

let result

while ((result = hasEnded(game)) == -2) {
    if (turn == playerSide) {
        console.log("Player Move")
        let isValid
        do {
            let move = await rl.question('Choose a position (row and column, 1-3, not separated, e.g. 31): ')
            isValid = checkMove(move)
            
            switch (isValid[0]) {
                case -1:
                    console.log("Invalid move: position not found.")
                    break;
                case 0:
                    console.log(`Invalid move: row ${isValid[1] + 1} col ${isValid[2] + 1} is occupied.`)
                    break;
                case 1:
                    game = doMove(game, turn, isValid[1], isValid[2])
                    break;
            }
        } while (isValid[0] != 1)
    } else {
        console.log("AI Move")

        if (turns_played == 0) {
            let move = Math.round(Math.random() * 8)
            let row = Math.floor(move / 3)
            let col = (move / 3 - row) * 3
            if (row >= 0 && row <= 2 && col >= 0 && col <= 2) {
                game = doMove(game, turn, row, col)
            }
        } else {
            let analysis = think(game, turn)
            game = doMove(game, turn, analysis[1], analysis[2])
        }
    }
    displayGame()
    turn *= -1
    turns_played += 1
}

if (result == 0) {
    console.log("Draw!")
} else if (result == playerSide) {
    console.log("You won!")
} else if (result == AISide) {
    console.log("You lost!")
}

rl.close()