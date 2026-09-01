import React from 'react';
import './StageTimeline.css';
import {
  UploadCloud,
  FileCheck,
  ListOrdered,
  Hourglass,
  Cpu,
  Check,
  AlertCircle,
} from 'lucide-react';

export const STAGES = [
  { key: 'File uploading', label: '1. Uploading', icon: UploadCloud },
  { key: 'File uploaded', label: '2. Uploaded', icon: FileCheck },
  { key: 'File added to queue', label: '3. Enqueued', icon: ListOrdered },
  { key: 'Waiting for processing', label: '4. Waiting', icon: Hourglass },
  { key: 'Processing…', label: '5. Processing', icon: Cpu },
  { key: 'Completed', label: '6. Completed', icon: Check },
];

/**
 * Monochrome editorial 6-step lifecycle tracker
 */
export function StageTimeline({ currentStatus, progress = 0, workerId = null, error = null }) {
  const isFailed = currentStatus === 'Failed';

  const getCurrentIndex = () => {
    if (isFailed) return -1;
    const idx = STAGES.findIndex((s) => s.key === currentStatus);
    return idx !== -1 ? idx : 0;
  };

  const activeIndex = getCurrentIndex();

  if (isFailed) {
    return (
      <div className="StageTimeline-failed-box">
        <AlertCircle className="StageTimeline-failed-icon" />
        <span><strong>[ Error ]:</strong> {error || 'Worker execution failed'}</span>
      </div>
    );
  }

  return (
    <div className="StageTimeline-container">
      <div className="StageTimeline-grid">
        {STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isPassed = idx < activeIndex || currentStatus === 'Completed';
          const isCurrent = idx === activeIndex && currentStatus !== 'Completed';

          let circleClass = 'StageTimeline-circle-upcoming';
          let labelClass = 'StageTimeline-label-upcoming';
          let connectorClass = 'StageTimeline-connector-upcoming';

          if (isPassed) {
            circleClass = 'StageTimeline-circle-passed';
            labelClass = 'StageTimeline-label-passed';
            connectorClass = 'StageTimeline-connector-passed';
          } else if (isCurrent) {
            circleClass = 'StageTimeline-circle-current';
            labelClass = 'StageTimeline-label-current';
            connectorClass = 'StageTimeline-connector-active';
          }

          return (
            <div key={stage.key} className="StageTimeline-step">
              {idx < STAGES.length - 1 && (
                <div className={`StageTimeline-connector ${connectorClass}`} />
              )}

              <div className={`StageTimeline-circle ${circleClass}`}>
                {isPassed && stage.key !== 'Completed' ? (
                  <Check className="StageTimeline-icon" />
                ) : (
                  <Icon
                    className={`StageTimeline-icon ${
                      isCurrent && stage.key === 'Processing…'
                        ? 'StageTimeline-spin'
                        : isCurrent && stage.key === 'Waiting for processing'
                        ? 'StageTimeline-bounce'
                        : ''
                    }`}
                  />
                )}
              </div>

              <span className={`StageTimeline-label ${labelClass}`}>
                {stage.label}
              </span>

              {isCurrent && stage.key === 'Waiting for processing' && workerId && (
                <span className="StageTimeline-chip">
                  [ {workerId.split(' ')[0]} ]
                </span>
              )}

              {isCurrent && stage.key === 'Processing…' && (
                <span className="StageTimeline-chip">
                  [ {progress}% ]
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
