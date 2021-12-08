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

function removePos(cell, value) {
	const tab = cell.pos
	const idx = tab.indexOf(value)
	if (idx != -1) {
		console.log('removePos idx', cell.idx, 'grp=', cell.group, 'value=', value)
		tab.splice(idx, 1)
		return true
	}
	return false
}



function format(val) {
	return (val / 100).toFixed(2).split('.')[1]
}

function showGame(nbLine, nbCol, usedCells) {
	for (let i = 0; i < nbLine; i++) {
		const text = []
		for (let k = 0; k < nbCol; k++) {
			const val = 1 + k + i * nbCol
			text.push(usedCells.includes(val) ? 'XX' : format(val))
		}
		console.log(text.join(' '))
	}
}

function showValue(info) {
	console.log('showValue')
	const { nbLine, nbCol, board } = info
	for (let i = 0; i < nbLine; i++) {
		const text = []
		for (let k = 0; k < nbCol; k++) {
			const value = board[k + i * nbCol].value
			text.push(value == 0 ? 'XX' : format(value))
		}
		console.log(text.join(' '))
	}
}



function showGroups(info) {
	console.log('groups', info.groups)
	const { nbLine, nbCol, board } = info
	for (let i = 0; i < nbLine; i++) {
		const text = []
		for (let k = 0; k < nbCol; k++) {
			const value = board[k + i * nbCol].group
			text.push(format(value))
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
				ret.board[s[0] - 1] = { value: (s.length == 2) ? s[1] : 0 }
			})
			console.log('cells', cells)

			groups.push(cells.map(i => i - 1))
			group++

		}

	})
	ret.groups = groups

	return ret
}

async function run() {
	const nbLine = await readNumber('Enter nb line')
	console.log('nbLine', nbLine)

	const nbCol = await readNumber('Enter nb column')
	console.log('nbCol', nbCol)

	const nbCells = nbCol * nbLine


	const board = new Array(nbCells)
	const data = []
	data.push(nbLine + ',' + nbCol)
	//console.log(board)

	const groups = []
	let group = 1
	const usedCells = []

	while (usedCells.length != nbCells) {
		showGame(nbLine, nbCol, usedCells)
		const groupCell = []
		const input = await readString('Enter cell for group ' + group)
		data.push(input)
		const cells = []
		input.split(',').forEach(i => {
			const s = i.split(':').map(k => parseInt(k))
			cells.push(s[0])
			board[s[0] - 1] = { value: (s.length == 2) ? s[1] : 0 }
		})
		console.log('cells', cells)
		cells.forEach((val) => {
			usedCells.push(val)
		})

		groups.push(cells.map(i => i - 1))

		group++
	}
	//console.log(board)
	const info = { board, groups, nbLine, nbCol }

	fs.writeFileSync('board' + Date.now() + '.txt', data.join('\n'))

	computePos(info)

	showValue(info)
	showGroups(info)


	compute(info)
}

function showpos(board) {
	board.forEach((info, idx) => {
		const { value, pos, adjCell, adjGrp, group } = info
		console.log('idx=', idx, 'value=', value, 'group=', group, 'pos=', pos, 'adjCell=', adjCell, 'adjGrp=', adjGrp)
	})
	console.log('##############')
}

function newArray(length) {
	return new Array(length).fill(0).map((val, idx) => idx + 1)
}

function getNbPosByGroup(board, grp, value) {
	//console.log('getNbPosByGroup', grp, value)
	let ret = 0
	grp.forEach((cellIdx) => {
		if (board[cellIdx].pos.includes(value)) {
			ret++;
		}
	})
	//console.log('ret', ret)
	return ret
}

function computePos(info) {
	const { groups, board, nbCol, nbLine } = info

	groups.forEach((grp, idx) => {
		grp.forEach((val) => {
			board[val].group = idx
			board[val].pos = (board[val].value != 0) ? [] : newArray(grp.length)
		})
	})

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

	board.forEach((cell, cellIdx) => {
		const x = cellIdx % nbCol
		const y = Math.trunc(cellIdx / nbCol)
		cell.adjCell = []
		cell.adjGrp = {}
		cell.idx = cellIdx
		//console.log('cellIdx', cellIdx)
		//console.log('x=', x, 'y=', y, 'value=', cell.value)


		move.forEach((m) => {
			//console.log('move', m)
			const xx = x + m[0]
			const yy = y + m[1]
			//console.log('xx=', xx, 'yy=', yy)
			const idx = xx + yy * nbCol
			if (xx >= 0 && xx < nbCol && yy >= 0 && yy < nbLine) {
				cell.adjCell.push(idx)

				const group = board[idx].group
				if (group != cell.group) {
					if (cell.adjGrp[group] == undefined) {
						cell.adjGrp[group] = []
					}
					cell.adjGrp[group].push(idx)
				}
			}
		})

	})

	board.forEach((cell) => {
		const value = cell.value
		if (value != 0) {
			valueFound(info, cell, value)
		}
	})


}

function valueFound(info, cell, value) {
	const { groups, board } = info
	const grp = groups[cell.group]
	let hasChange = false
	// supprimer la valeur des possibilités de toutes les cases du même groupe
	grp.forEach((i) => {
		if (removePos(board[i], value)) {
			hasChange = true
		}

	})
	// supprimer la valeur des possibilités de toutes les cases adjacantes
	cell.adjCell.forEach((idx) => {
		if (removePos(board[idx], value)) {
			hasChange = true
		}
	})
	return hasChange

}

function compute(info) {
	//console.log('compute', info)
	const { groups, board, nbCol, nbLine } = info


	//showpos(board)



	//showpos(board)

	let hasChange = true
	let step = 1

	while (hasChange) {

		let nbCellNotFound = board.filter((i) => i.value == 0).length
		console.log('nbCellNotFound', nbCellNotFound)
		if (nbCellNotFound == 0) {
			break
		}

		hasChange = false
		console.log('step=', step++)

		board.forEach((cell, cellIdx) => {
			if (cell.pos.length == 1) { // il n'y plus qu'une seule possibilté, on a trouvé la valeur
				const value = cell.pos.pop()
				cell.value = value
				if (valueFound(info, cell, value)) {
					hasChange = true
				}
			}
		})

		showValue(info)

		nbCellNotFound = board.filter((i) => i.value == 0).length
		console.log('nbCellNotFound', nbCellNotFound)
		if (nbCellNotFound == 0) {
			break
		}


		board.forEach((cell, cellIdx) => {
			//console.log('checkCell', cellIdx, cell.pos, cell.adjGrp)
			cell.pos.forEach((pos) => {
				//console.log('check pos', pos)
				Object.entries(cell.adjGrp).forEach(([key, value]) => {
					const occurInGroup = getNbPosByGroup(board, groups[key], pos)
					const occurInAdj = getNbPosByGroup(board, value, pos)

					if (occurInGroup != 0 && occurInAdj == occurInGroup) {
						if (removePos(cell, pos)) {
							hasChange = true
						}
					}
				})
			})

		})


		//console.log(board)
		showValue(info)
	}

}


console.log(process.argv)
if (process.argv.length == 3) {
	const info = readFile(process.argv[2])
	computePos(info)
	//showpos(info.board)
	showValue(info)
	showGroups(info)
	compute(info)
	//showpos(info.board)
}
else {
	run()
}
