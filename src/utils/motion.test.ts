import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  APPLE_EASE,
  buildDialogVariants,
  buildPageTransitionVariants,
  buildSectionVariants,
  buildStaggerContainerVariants,
  buildStaggerItemVariants,
  computeStaggerDelay,
  MAX_STAGGER_ITEMS,
  STAGGER_STEP,
} from './motion.ts';

describe('Apple-inspired motion configuration', () => {
  it('caps stagger delays cleanly for large grids and lists', () => {
    assert.equal(computeStaggerDelay(0), 0);
    assert.equal(computeStaggerDelay(-3), 0);
    assert.equal(computeStaggerDelay(2), Number((2 * STAGGER_STEP).toFixed(3)));
    assert.equal(
      computeStaggerDelay(25),
      Number((MAX_STAGGER_ITEMS * STAGGER_STEP).toFixed(3))
    );
  });

  it('produces animated page and section variants with quintic easing when motion is enabled', () => {
    const page = buildPageTransitionVariants(false);
    assert.equal(page.initial.opacity, 0);
    assert.ok(page.initial.y > 0);
    assert.equal(page.animate.transition.ease, APPLE_EASE);

    const section = buildSectionVariants(false, 2);
    assert.ok(section.hidden.y > 0);
    assert.equal(section.visible.transition.delay, computeStaggerDelay(2, 6));

    const container = buildStaggerContainerVariants(false);
    assert.equal(container.visible.transition.staggerChildren, STAGGER_STEP);

    const item = buildStaggerItemVariants(false);
    assert.ok(item.hidden.y > 0);
    assert.ok(item.hidden.scale < 1);
  });

  it('zeroes spatial translation and minimizes duration when reduced motion is active', () => {
    const page = buildPageTransitionVariants(true);
    assert.equal(page.initial.y, 0);
    assert.equal(page.initial.scale, 1);
    assert.equal(page.animate.transition.duration, 0.01);

    const section = buildSectionVariants(true, 4);
    assert.equal(section.hidden.y, 0);
    assert.equal(section.visible.transition.delay, 0);

    const dialog = buildDialogVariants(true);
    assert.equal(dialog.hidden.y, 0);
    assert.equal(dialog.hidden.scale, 1);
  });
});
