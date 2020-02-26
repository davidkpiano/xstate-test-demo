import React from 'react';
import Feedback from './App';
import { Machine } from 'xstate';
import { render, fireEvent, cleanup } from '@testing-library/react';
import { assert } from 'chai';
import { createModel } from '../../xstate/packages/xstate-test/lib';

// describe('feedback app', () => {
//   afterEach(cleanup);

//   it('should show the thanks screen when "Good" is clicked', () => {
//     const { getByTestId } = render(<Feedback />);

//     // The question screen should be visible at first
//     assert.ok(getByTestId('question-screen'));

//     // Click the "Good" button
//     fireEvent.click(getByTestId('good-button'));

//     // Now the thanks screen should be visible
//     assert.ok(getByTestId('thanks-screen'));
//   });

//   it('should show the form screen when "Bad" is clicked', () => {
//     const { getByTestId } = render(<Feedback />);

//     // The question screen should be visible at first
//     assert.ok(getByTestId('question-screen'));

//     // Click the "Bad" button
//     fireEvent.click(getByTestId('bad-button'));

//     // Now the form screen should be visible
//     assert.ok(getByTestId('form-screen'));
//   });
// });

// ............

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
          test: ({ getByTestId }) => {
            assert.ok(getByTestId('question-screen'));
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
          test: ({ getByTestId }) => {
            assert.ok(getByTestId('form-screen'));
          }
        }
      },
      thanks: {
        on: {
          CLOSE: 'closed'
        },
        meta: {
          test: ({ getByTestId }) => {
            assert.ok(getByTestId('thanks-screen'));
          }
        }
      },
      closed: {
        type: 'final',
        meta: {
          test: ({ queryByTestId }) => {
            assert.isNull(queryByTestId('thanks-screen'));
          }
        }
      }
    }
  });

  const testModel = createModel(feedbackMachine, {
    events: {
      CLICK_GOOD: ({ getByText }) => {
        fireEvent.click(getByText('Good'));
      },
      CLICK_BAD: ({ getByText }) => {
        fireEvent.click(getByText('Bad'));
      },
      CLOSE: ({ getByTestId }) => {
        fireEvent.click(getByTestId('close-button'));
      },
      ESC: ({ baseElement }) => {
        fireEvent.keyDown(baseElement, { key: 'Escape' });
      },
      SUBMIT: {
        exec: async ({ getByTestId }, event) => {
          fireEvent.change(getByTestId('response-input'), {
            target: { value: event.value }
          });
          fireEvent.click(getByTestId('submit-button'));
        },
        cases: [{ value: 'something' }, { value: '' }]
      }
    }
  });

  const testPlans = testModel.getSimplePathPlans();

  testPlans.forEach(plan => {
    describe(plan.description, () => {
      afterEach(cleanup);

      plan.paths.forEach(path => {
        it(path.description, () => {
          const rendered = render(<Feedback />);
          return path.test(rendered);
        });
      });
    });
  });

  it('coverage', () => {
    testModel.testCoverage();
  });
});
