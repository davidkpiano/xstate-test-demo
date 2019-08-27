import { Machine } from 'xstate';

export const feedbackMachine = Machine({
  id: 'feedback',
  initial: 'question',
  states: {
    question: {
      on: {
        CLICK_GOOD: 'acknowledge',
        CLICK_BAD: 'form',
        CLOSE: 'closed',
        ESC: 'closed'
      }
    },
    form: {
      initial: 'pending',
      states: {
        pending: {
          on: {
            SUBMIT: [
              { target: 'submitted', cond: 'formValid' },
              { target: 'invalid' }
            ]
          }
        },
        invalid: {
          on: {
            FOCUS: 'pending'
          }
        },
        submitted: {}
      },
      on: {
        CLOSE: 'closed',
        ESC: 'closed'
      }
    },
    acknowledge: {
      on: {
        CLOSE: 'closed',
        ESC: 'closed'
      }
    },
    closed: {
      type: 'final'
    }
  }
});
