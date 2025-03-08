<style scoped>
.order-tracking {
  max-width: 800px;
  margin: 0 auto;
}

.map-container {
  height: 300px;
  width: 100%;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.timeline-container {
  padding: 16px 0;
}

.timeline-item-wrapper {
  transition: all 0.3s ease;
}

.timeline-item-wrapper:hover {
  transform: translateX(4px);
}

.timeline-item.active {
  background-color: var(--v-primary-lighten-5);
  border-radius: 8px;
  padding: 8px;
  margin: -8px;
}

.eta-display {
  background-color: var(--v-primary-lighten-5);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.eta-content {
  position: relative;
  z-index: 1;
}

.progress-bar {
  height: 4px;
  background-color: var(--v-primary-lighten-3);
  border-radius: 2px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background-color: var(--v-primary-base);
  transition: width 0.5s ease-out;
}

.chat-container {
  height: 400px;
  display: flex;
  flex-direction: column;
}

.messages {
  flex-grow: 1;
  overflow-y: auto;
}

.message {
  max-width: 80%;
  margin-bottom: var(--spacing-sm);
}

.message.sent {
  margin-left: auto;
}

.message-bubble {
  background-color: var(--v-primary-lighten-4);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: 12px;
  display: inline-block;
}

.message.sent .message-bubble {
  background-color: var(--v-primary-base);
  color: white;
}

.message-time {
  margin-top: 4px;
  opacity: 0.7;
}

.driver-info {
  border-top: 1px solid var(--v-border-base);
  background-color: var(--v-surface-base);
  transition: background-color 0.3s ease;
}

.driver-info:hover {
  background-color: var(--v-surface-lighten-1);
}

.map-info-window {
  padding: 8px;
  max-width: 200px;
}

.map-info-window h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.map-info-window p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

@media (max-width: 600px) {
  .map-container {
    height: 250px;
  }
  
  .message {
    max-width: 90%;
  }
  
  .eta-display {
    margin: 8px;
  }
  
  .timeline-container {
    padding: 8px 0;
  }
}
</style>
