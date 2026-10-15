"use client";

import React, { useState } from "react";
import {
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  BrainCircuit,
  Eye,
  Check
} from "lucide-react";
import { SPACED_REPETITION_CARDS } from "@/lib/curriculum";

export default function RevisionDeck() {
  const [cards, setCards] = useState(SPACED_REPETITION_CARDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const currentCard = cards[currentIndex];

  function handleReview(remembered: boolean) {
    setIsFlipped(false);
    setCompletedCount(prev => prev + 1);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(-1); // Finished deck
    }
  }

  function resetDeck() {
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompletedCount(0);
  }

  return (
    <div className="revision-deck-wrapper">
      <div className="deck-header">
        <div className="deck-title-group">
          <div className="deck-icon">
            <BrainCircuit size={22} />
          </div>
          <div>
            <span className="deck-kicker">SPACED REPETITION ENGINE</span>
            <h3>Daily Knowledge Revision Queue</h3>
          </div>
        </div>

        <div className="deck-counter">
          <span>Reviewed Today:</span>
          <strong>{completedCount} / {cards.length} Cards</strong>
        </div>
      </div>

      {currentIndex >= 0 && currentCard ? (
        <div className="flashcard-container">
          <div
            className={`flashcard-card ${isFlipped ? "flipped" : ""}`}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className="card-top-tag">
              <span>{currentCard.category}</span>
              <small>{isFlipped ? "Click to view question" : "Click to reveal answer"}</small>
            </div>

            <div className="card-content-area">
              {!isFlipped ? (
                <div className="card-front">
                  <h4>{currentCard.front}</h4>
                  <div className="hint-btn">
                    <Eye size={16} /> Tap card to reveal verified explanation
                  </div>
                </div>
              ) : (
                <div className="card-back">
                  <div className="verified-badge">
                    <ShieldCheck size={16} /> Verified Academy Concept
                  </div>
                  <p>{currentCard.back}</p>
                </div>
              )}
            </div>
          </div>

          {/* Rating Action Buttons */}
          {isFlipped ? (
            <div className="review-action-buttons">
              <button
                onClick={() => handleReview(false)}
                className="review-btn again"
              >
                <AlertCircle size={18} />
                <div>
                  <strong>Need Revision</strong>
                  <small>Review again tomorrow</small>
                </div>
              </button>

              <button
                onClick={() => handleReview(true)}
                className="review-btn good"
              >
                <CheckCircle2 size={18} />
                <div>
                  <strong>Remembered Clearly</strong>
                  <small>Schedule for 4 days</small>
                </div>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsFlipped(true)}
              className="flip-prompt-btn"
            >
              Reveal Explanation <ArrowRight size={16} />
            </button>
          )}
        </div>
      ) : (
        /* Completed Deck State */
        <div className="deck-complete-card">
          <div className="complete-badge">
            <Check size={28} />
          </div>
          <h3>Daily Revision Complete!</h3>
          <p>
            You reviewed all {cards.length} active memory cards today. Spaced intervals reinforce long-term memory retention and combat cognitive decay.
          </p>
          <button onClick={resetDeck} className="restart-deck-btn">
            <RotateCcw size={16} /> Practice Deck Again
          </button>
        </div>
      )}
    </div>
  );
}
