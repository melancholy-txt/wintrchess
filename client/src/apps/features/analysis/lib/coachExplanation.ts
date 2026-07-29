import { Chess, PieceSymbol } from "chess.js";
import { StateTreeNode } from "shared/types/game/position/StateTreeNode";
import { Classification } from "shared/constants/Classification";
import { getTopEngineLine } from "shared/types/game/position/EngineLine";
import { getSimpleNotation } from "shared/lib/utils/chess";

export interface CoachExplanation {
    title: string;
    text: string;
    pieceMoved?: string;
    capturedPiece?: string;
    toSquare?: string;
    alternativeMoveSan?: string;
    alternativeMoveDisplay?: string;
    evaluationDiffText?: string;
}

const PIECE_NAMES: Record<PieceSymbol, string> = {
    p: "Pawn",
    n: "Knight",
    b: "Bishop",
    r: "Rook",
    q: "Queen",
    k: "King"
};

function getPlayedMoveInfo(node: StateTreeNode) {
    if (!node.parent || !node.state.move) return null;

    const prevBoard = new Chess(node.parent.state.fen);
    const moveResult = prevBoard.move(node.state.move.san);
    const currBoard = new Chess(node.state.fen);

    return {
        prevBoard,
        currBoard,
        moveResult
    };
}

function getTopAlternativeMove(node: StateTreeNode) {
    if (!node.parent) return null;

    const bestAlternativeUci = getTopEngineLine(
        node.parent.state.engineLines
    )?.moves.at(0)?.uci;

    if (!bestAlternativeUci) return null;

    const prevBoard = new Chess(node.parent.state.fen);
    try {
        return prevBoard.move(bestAlternativeUci);
    } catch {
        return null;
    }
}

export function generateCoachExplanation(
    node: StateTreeNode,
    simpleNotation: boolean = false
): CoachExplanation {
    if (!node.parent || !node.state.move) {
        return {
            title: "Starting Position",
            text: "The game is at the starting position. White has the first move!"
        };
    }

    const info = getPlayedMoveInfo(node);
    if (!info) {
        return {
            title: "Move Analysis",
            text: "Analysing position..."
        };
    }

    const { currBoard, moveResult } = info;
    const san = moveResult.san;
    const pieceName = PIECE_NAMES[moveResult.piece];
    const capturedPiece = moveResult.captured ? PIECE_NAMES[moveResult.captured] : undefined;
    const toSquare = moveResult.to;
    const isCheck = currBoard.isCheck();
    const isCheckmate = currBoard.isCheckmate();
    const isStalemate = currBoard.isStalemate();
    const classification = node.state.classification;
    const openingName = node.state.opening;

    // Check for top alternative move
    const alternativeMove = getTopAlternativeMove(node);
    let alternativeMoveDisplay: string | undefined;
    let alternativeMoveSan: string | undefined;

    if (alternativeMove && alternativeMove.san !== san) {
        alternativeMoveSan = alternativeMove.san;
        alternativeMoveDisplay = simpleNotation
            ? getSimpleNotation(alternativeMove)
            : alternativeMove.san;
    }

    // Special game endings
    if (isCheckmate) {
        return {
            title: "Checkmate!",
            text: `Delivers checkmate with ${san}! A decisive finish ending the game.`,
            pieceMoved: pieceName,
            capturedPiece,
            toSquare
        };
    }

    if (isStalemate) {
        return {
            title: "Stalemate",
            text: `The move leads to a stalemate drawing the position.`,
            pieceMoved: pieceName,
            toSquare
        };
    }

    // Castling moves
    if (san === "O-O") {
        return {
            title: "Kingside Castle",
            text: "Castles kingside to tuck the King away safely in the corner while bringing the Rook into active play."
        };
    }

    if (san === "O-O-O") {
        return {
            title: "Queenside Castle",
            text: "Castles queenside, securing King safety and placing immediate pressure along the open d-file."
        };
    }

    // Theory & Openings
    if (classification === Classification.THEORY || openingName) {
        const title = openingName || "Book Move";
        const text = openingName
            ? `Standard theoretical move in the ${openingName}. Sets up healthy pawn structure and piece coordination.`
            : `Follows well-established chess opening principles, controlling central squares and preparing piece development.`;
        return {
            title,
            text,
            pieceMoved: pieceName,
            toSquare,
            alternativeMoveSan,
            alternativeMoveDisplay
        };
    }

    // Classification-based custom commentary
    switch (classification) {
        case Classification.BRILLIANT: {
            const capText = capturedPiece ? ` while taking opponent's ${capturedPiece}` : "";
            return {
                title: "Brilliant Sacrifice!",
                text: `Spectacular move! ${pieceName} moves to ${toSquare}${capText}, offering a piece or key pawn to gain a winning attack.`,
                pieceMoved: pieceName,
                capturedPiece,
                toSquare
            };
        }

        case Classification.CRITICAL: {
            return {
                title: "Critical Continuation",
                text: `The key move! ${pieceName} to ${toSquare} was the only move holding the position intact.`,
                pieceMoved: pieceName,
                capturedPiece,
                toSquare
            };
        }

        case Classification.BEST: {
            if (capturedPiece) {
                return {
                    title: "Best Move - Clean Capture",
                    text: `Best move! Takes the ${capturedPiece} on ${toSquare}, gaining material and simplifying your advantage.`,
                    pieceMoved: pieceName,
                    capturedPiece,
                    toSquare
                };
            }
            if (isCheck) {
                return {
                    title: "Best Move - Forcing Check",
                    text: `Best move! Delivers check with the ${pieceName} to ${toSquare}, forcing your opponent into defensive mode.`,
                    pieceMoved: pieceName,
                    toSquare
                };
            }
            if (moveResult.piece === "p") {
                return {
                    title: "Best Move - Space Gain",
                    text: `Best move! Advances pawn to ${toSquare}, claiming space in the center and restricting enemy pieces.`,
                    pieceMoved: "Pawn",
                    toSquare
                };
            }
            return {
                title: "Best Move - Optimal Activity",
                text: `Best move! Places the ${pieceName} on ${toSquare}, maximizing activity and piece harmony.`,
                pieceMoved: pieceName,
                toSquare
            };
        }

        case Classification.EXCELLENT: {
            if (capturedPiece) {
                return {
                    title: "Excellent Capture",
                    text: `Strong play! Captures the ${capturedPiece} on ${toSquare}, maintaining solid pressure.`,
                    pieceMoved: pieceName,
                    capturedPiece,
                    toSquare
                };
            }
            return {
                title: "Excellent Move",
                text: `Strong move! Develops the ${pieceName} to ${toSquare} and builds a solid position.`,
                pieceMoved: pieceName,
                toSquare
            };
        }

        case Classification.OKAY: {
            return {
                title: "Solid Choice",
                text: `A reasonable move with ${pieceName} to ${toSquare}. Holds the line, though sharper options were available.`,
                pieceMoved: pieceName,
                toSquare,
                alternativeMoveSan,
                alternativeMoveDisplay
            };
        }

        case Classification.INACCURACY: {
            const altText = alternativeMoveDisplay ? ` ${alternativeMoveDisplay} was stronger.` : "";
            return {
                title: "Minor Inaccuracy",
                text: `Slight inaccuracy with ${san}.${altText} Moves the ${pieceName} to ${toSquare} but hands away a bit of initiative.`,
                pieceMoved: pieceName,
                toSquare,
                alternativeMoveSan,
                alternativeMoveDisplay
            };
        }

        case Classification.MISTAKE: {
            const altText = alternativeMoveDisplay ? ` ${alternativeMoveDisplay} would have maintained balance.` : "";
            return {
                title: "Mistake Made",
                text: `A mistake! ${san} compromises your position.${altText}`,
                pieceMoved: pieceName,
                toSquare,
                alternativeMoveSan,
                alternativeMoveDisplay
            };
        }

        case Classification.BLUNDER: {
            const altText = alternativeMoveDisplay ? ` ${alternativeMoveDisplay} was needed to save the position.` : "";
            return {
                title: "Tactical Blunder",
                text: `A blunder! ${san} drops significant evaluation or material.${altText}`,
                pieceMoved: pieceName,
                toSquare,
                alternativeMoveSan,
                alternativeMoveDisplay
            };
        }

        case Classification.FORCED: {
            return {
                title: "Forced Defense",
                text: `Forced reply. No other legal options existed in this position.`,
                pieceMoved: pieceName,
                toSquare
            };
        }

        case Classification.RISKY: {
            return {
                title: "Risky Idea",
                text: `A sharp and risky play with ${san}. Creates tactical chances but leaves potential counter-weaknesses.`,
                pieceMoved: pieceName,
                toSquare
            };
        }

        default: {
            const checkText = isCheck ? " Delivers check!" : "";
            const capText = capturedPiece ? ` Capturing the ${capturedPiece}.` : "";
            return {
                title: `${pieceName} to ${toSquare}`,
                text: `Moves ${pieceName} to ${toSquare}.${capText}${checkText}`,
                pieceMoved: pieceName,
                capturedPiece,
                toSquare,
                alternativeMoveSan,
                alternativeMoveDisplay
            };
        }
    }
}
