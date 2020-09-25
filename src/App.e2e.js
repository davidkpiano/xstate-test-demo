const { Machine } = require('xstate');
const { createModel } = require('@xstate/test');

describe('feedback app', () => {
  const feedbackMachine = Machine({
    id: 'feedback',
    initial: 'question',
    states: {
      question: {
        on: {
          CLICK_GOOD: 'thanks',
          CLICK_BAD: 'form',
          CLOSE: 'closed'
        },
        meta: {
          test: async page => {
            await page.waitFor('[data-testid="question-screen"]');
          }
        }
      },
      form: {
        on: {
          SUBMIT: [
            {
              target: 'thanks',
              cond: (_, e) => e.value.length
            }
          ],
          CLOSE: 'closed'
        },
        meta: {
          test: async page => {
            await page.waitFor('[data-testid="form-screen"]');
          }
        }
      },
      thanks: {
        on: {
          CLOSE: 'closed'
        },
        meta: {
          test: async page => {
            await page.waitFor('[data-testid="thanks-screen"]');
          }
        }
      },
      closed: {
        type: 'final',
        meta: {
          test: async page => {
            return true;
          }
        }
      }
    }
  });

  const testModel = createModel(feedbackMachine, {
    events: {
      CLICK_GOOD: async page => {
        await page.click('[data-testid="good-button"]');
      },
      CLICK_BAD: async page => {
        await page.click('[data-testid="bad-button"]');
      },
      CLOSE: async page => {
        await page.click('[data-testid="close-button"]');
      },
      ESC: async page => {
        await page.press('Escape');
      },
      SUBMIT: {
        exec: async (page, event) => {
          await page.type('[data-testid="response-input"]', event.value);
          await page.click('[data-testid="submit-button"]');
        },
        cases: [{ value: 'something' }, { value: '' }]
      }
    }
  });

  const testPlans = testModel.getSimplePathPlans();

  testPlans.forEach((plan, i) => {
    describe(plan.description, () => {
      plan.paths.forEach((path, i) => {
        it(
          path.description,
          async () => {
            await page.goto(`http://localhost:${process.env.PORT || '3000'}`);
            await path.test(page);
          },
          10000
        );
      });
    });
  });

  it('coverage', () => {
    testModel.testCoverage();
  });
});
