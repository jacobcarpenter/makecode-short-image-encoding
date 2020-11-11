// from https://github.com/microsoft/pxt/blob/9ecd7475a5cd2106b609f16cbd2c28971edfa62d/pxtlib/spriteutils.ts#L3
// prettier-ignore
export const hexChars = [".", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];

export function getValue(ch) {
	// from https://github.com/microsoft/pxt/blob/9ecd7475a5cd2106b609f16cbd2c28971edfa62d/pxtlib/spriteutils.ts#L595-L612
	// prettier-ignore
	switch (ch) {
    case "0": case ".": return 0;
    case "1": case "#": return 1;
    case "2": case "T": return 2;
    case "3": case "t": return 3;
    case "4": case "N": return 4;
    case "5": case "n": return 5;
    case "6": case "G": return 6;
    case "7": case "g": return 7;
    case "8": return 8;
    case "9": return 9;
    case "a": case "A": case "R": return 10;
    case "b": case "B": case "P": return 11;
    case "c": case "C": case "p": return 12;
    case "d": case "D": case "O": return 13;
    case "e": case "E": case "Y": return 14;
    case "f": case "F": case "W": return 15;
    default: throw new Error(`Unknown character value: ${ch}`);
  }
}
