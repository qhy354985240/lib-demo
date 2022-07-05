const {
  SyncHook,
  SyncBailHook,
  SyncWaterfallHook,
  SyncLoopHook,
  AsyncParallelHook,
  AsyncParallelBailHook,
  AsyncSeriesHook,
  AsyncSeriesBailHook,
  AsyncSeriesWaterfallHook,
} = require('tapable');

class Car {
  constructor() {
    this.hooks = {
      beforeRun: new SyncHook(['options']),
      run: new SyncBailHook(['type']),
      parsing: new SyncWaterfallHook(['res']),
      parsed: new AsyncSeriesHook(['compilation', 'name']),
    };
  }

  syncHook() {
    const options = {
      a: 1,
      b: 2,
    };
    this.hooks.beforeRun.call(options);
  }

  syncBailHook() {
    const type = '0';
    this.hooks.run.call(type);
  }

  syncWaterfallHook() {
    const res = 1;
    this.hooks.parsing.call(res);
  }

  asyncSeriesHook() {
    const compilation = { sum: 1 },
      name = 'xxx';
    this.hooks.parsed.callAsync(compilation, name, res => {
      console.log(res, 'end');
    });
  }
}

const my = new Car();

// 1
// SyncHook，同步执行hook，即使第一个函数修改了，也不会传到下一个函数里面
my.hooks.beforeRun.tap('changeConfig', options => {
  console.log(options, 'first');
  return { ...options, a: 2 };
});

my.hooks.beforeRun.tap('readConfig', options => {
  console.log(options, 'second');
});
// my.syncHook();
// { a: 1, b: 2 } 1111
// { a: 1, b: 2 } 2222

// 2
// SyncBailHook，同步执行hook，返回任何内容（除undefined）之后就会终止下面流程
my.hooks.run.tap('first', type => {
  console.log(type, 'first');
  if (type === '0') {
    return 1;
  }
});

my.hooks.run.tap('second', type => {
  console.log(type, 'second');
  if (type === '1') {
    return;
  }
  return 2;
});
// my.syncBailHook();
// 0 first

// 3
// SyncWaterfallHook，同步瀑布流执行hook，函数的返回值会作为下一个回调的参数传入
my.hooks.parsing.tap('first', res => {
  console.log(res, 'first');
  return res + 1;
});

my.hooks.parsing.tap('second', res => {
  console.log(res, 'second');
  return res + 1;
});
// my.syncWaterfallHook();
// 1 first
// 2 second

// 4
// AsyncSeriesHook，异步执行的hook,如果调用不带参数的cb则是执行下一个插件，如果调用了带参数的cb则调在callAsync写入的回调，否则不会执行下一个
my.hooks.parsed.tapAsync('first', (compilation, name, cb) => {
  setTimeout(() => {
    console.log('first');
    cb();
  });
});

my.hooks.parsed.tapAsync('second', (compilation, name, cb) => {
  console.log('second');
  cb(1);
});
my.asyncSeriesHook();
// first
// second
// 1 end
