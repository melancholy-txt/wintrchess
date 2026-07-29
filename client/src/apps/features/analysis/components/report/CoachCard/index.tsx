import React from "react";
import { StateTreeNode, addChildMove } from "shared/types/game/position/StateTreeNode";
import { generateCoachExplanation } from "@analysis/lib/coachExplanation";
import useSettingsStore from "@/stores/SettingsStore";
import useAnalysisBoardStore from "@analysis/stores/AnalysisBoardStore";
import playBoardSound from "@/lib/boardSounds";
import coachAvatarImg from "@assets/img/coach.png";

import * as styles from "./CoachCard.module.css";

interface CoachCardProps {
    node: StateTreeNode;
}

function CoachCard({ node }: CoachCardProps) {
    const { settings } = useSettingsStore();
    const { setCurrentStateTreeNode } = useAnalysisBoardStore();

    if (!settings.analysis.coach?.enabled) {
        return null;
    }

    const explanation = generateCoachExplanation(
        node,
        settings.analysis.simpleNotation
    );

    function playAlternativeMove() {
        if (!node.parent || !explanation.alternativeMoveSan) return;

        const createdNode = addChildMove(node.parent, explanation.alternativeMoveSan);
        setCurrentStateTreeNode(createdNode);
        playBoardSound(createdNode);
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <div className={styles.avatarContainer}>
                    <img
                        src={coachAvatarImg}
                        alt="Chess Coach"
                        className={styles.avatar}
                    />
                    <span className={styles.statusBadge}>Coach</span>
                </div>

                <div className={styles.titleArea}>
                    <span className={styles.coachLabel}>Chess Coach Insight</span>
                    <span className={styles.moveTitle}>{explanation.title}</span>
                </div>
            </div>

            <div className={styles.speechBubble}>
                <p className={styles.speechBubbleText}>{explanation.text}</p>

                {explanation.alternativeMoveDisplay && (
                    <div
                        className={styles.alternativeAction}
                        onClick={playAlternativeMove}
                        role="button"
                        tabIndex={0}
                    >
                        <span>Coach recommends:</span>
                        <span className={styles.alternativeMoveBtn}>
                            {explanation.alternativeMoveDisplay}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CoachCard;
