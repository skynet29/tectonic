const fs = require('fs')


async function readNumber(text) {

	console.log(text)
	return new Promise((resolve) => {
		process.stdin.on('data', data => {
			resolve(parseInt(data.toString()))
		})
	})	
}

async function readString(text) {

	console.log(text)
	return new Promise((resolve) => {
		process.stdin.on('data', data => {
			resolve(data.toString())
		})
	})	
}

function removeValue(tab, value) {
	const idx = tab.indexOf(value)
	if (idx != -1) {
		tab.splice(idx, 1)
		return true
	}
	return false
}

function removeBoardValue(board, idx, value) {
	removeValue(board[idx].pos, value)
}

function format(val) {
	return (val / 100).toFixed(2).split('.')[1]
}

function showGame(nbLine, nbCol, usedCells) {
	for(let i = 0; i < nbLine; i++) {
		const text = []
		for(let k = 0; k < nbCol; k++) {
			const val = 1 + k + i * nbCol
			text.push(usedCells.includes(val) ? 'XX' : format(val))
		}
		console.log(text.join(' '))
	}
}

function showValue(info) {
	const {nbLine, nbCol, board} = info
	for(let i = 0; i < nbLine; i++) {
		const text = []
		for(let k = 0; k < nbCol; k++) {
			const value = board[k + i * nbCol].value
			text.push(value == 0 ? 'XX' : format(value))
		}
		console.log(text.join(' '))
	}
}

function findGroup(groups, value) {
	for(let i = 0; i < groups.length; i++) {
		if (groups[i].includes(value+1)) {
			return i+1;
		}
	}
	return 0
}

function showGroups(info) {
	console.log('groups')
	const {nbLine, nbCol, groups} = info
	for(let i = 0; i < nbLine; i++) {
		const text = []
		for(let k = 0; k < nbCol; k++) {
			const value = findGroup(groups, k + i * nbCol)
			text.push(value == 0 ? 'XX' : format(value))
		}
		console.log(text.join(' '))
	}
}

function readFile(fileName) {
	console.log('readFile', fileName)
	const text = fs.readFileSync(fileName).toString()
	console.log('text', text)
	const lines = text.split('\n')
	console.log('lines', lines.length)

	let group = 1
	const groups = []
	const ret = {}

	lines.forEach((input, idx) => {

		if (idx == 0) {
			const t = input.split(',')
			const nbLine = parseInt(t[0])
			const nbCol = parseInt(t[1])
			const nbCells = nbCol * nbLine
			ret.nbCol = nbCol
			ret.nbLine = nbLine
			ret.board = new Array(nbCells)
		}
		else {
			const cells = []

			input.split(',').forEach(i => {
				const s = i.split(':').map(k => parseInt(k))
				cells.push(s[0])
				ret.board[s[0]-1] = {value: (s.length == 2)? s[1] : 0}
			})
			console.log('cells', cells)
			
			groups.push(cells)
			group++	

		}

	})
	ret.groups = groups

	return ret
}

async function run()
{
	const nbLine = await readNumber('Enter nb line')
	console.log('nbLine', nbLine)

	const nbCol = await readNumber('Enter nb column')
	console.log('nbCol', nbCol)

	const nbCells = nbCol * nbLine


	const board = new Array(nbCells)
	//console.log(board)
	
	const groups = []
	let group = 1
	const usedCells = []

	while(usedCells.length != nbCells) {
		showGame(nbLine, nbCol, usedCells)
		const groupCell = []
		const input = await readString('Enter cell for group ' + group)
		const cells = []
		input.split(',').forEach(i => {
			const s = i.split(':').map(k => parseInt(k))
			cells.push(s[0])
			board[s[0]-1] = {value: (s.length == 2)? s[1] : 0}
		})
		console.log('cells', cells)
		cells.forEach((val) => {
			usedCells.push(val)
		})
		
		groups.push(cells)
		group++	
	}
	//console.log(board)
	const info = {board, groups, nbLine, nbCol}

	showValue(info)
	showGroups(info)


	compute(info)
	showpos(info.board)
}

function showpos(board) {
	board.forEach((info, idx) => {
		const {value, pos} = info
		console.log('idx=', idx, 'value=', value, 'pos=', pos)
	})
	console.log('##############')
}

function compute(info) {
	//console.log('compute', info)
	const {groups, board, nbCol, nbLine} = info

	groups.forEach((grp, idx) => {
		grp.forEach((val) => {
			board[val-1].group = idx
			board[val-1].pos = (board[val-1].value != 0) ? [] : new Array(grp.length).fill(0).map((val, idx) => idx+1)
		})
	})

	//showpos(board)

	board.forEach((cell, cellIdx) => {
		const value = cell.value
		if (value != 0) {
			const grp = groups[cell.group]
			grp.forEach((i) => {
				removeValue(board[i-1].pos, value)
			})

		}
	})

	//showpos(board)

	let hasChange = true
	let step = 1

	while (hasChange) {
		hasChange = false
		console.log('step', step++)

		board.forEach((cell, cellIdx) => {
			const value = cell.value
			if (value != 0) {
				const grp = groups[cell.group]
				grp.forEach((i) => {
					removeValue(board[i-1].pos, value)
				})
	
				const x = cellIdx % nbCol
				const y = Math.trunc(cellIdx / nbCol)
				//console.log('cellIdx', cellIdx)
				//console.log('x=', x, 'y=', y, 'value=', cell.value)
				const move = [
					[-1, -1],
					[-1, 0],
					[-1, 1],
					[0, -1],
					[0, 1],
					[1, -1],
					[1, 0],
					[1, 1]
				]
	
				move.forEach((m) => {
					//console.log('move', m)
					const xx = x + m[0]
					const yy = y + m[1]
					//console.log('xx=', xx, 'yy=', yy)
					if (xx >= 0 && xx < nbCol && yy >=0 && yy < nbLine) {
						removeBoardValue(board, xx + yy * nbCol, value)
					}
				})
	
			}
		})
	
		//showpos(board)
	
		board.forEach((cell, cellIdx) => {
			if (cell.pos.length == 1) {
				board[cellIdx].value = cell.pos.pop()
				hasChange = true
			}
		})
	
		//showpos(board)
	
	
		//console.log(board)
		showValue(info)
	}

}


console.log(process.argv)
if (process.argv.length == 3) {
	const info = readFile(process.argv[2])
	showValue(info)
	showGroups(info)
	compute(info)
	showpos(info.board)
}
else
{
	run()
}
