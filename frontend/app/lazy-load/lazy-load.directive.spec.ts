import { LazyLoadDirective } from './lazy-load.directive';

describe('LazyLoadDirective', () => {
  it('should create an instance', () => {
    const directive = new LazyLoadDirective(null, null);
    expect(directive).toBeTruthy();
  });
});
