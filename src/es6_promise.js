// ES6 promises shim
// Based on https://github.com/getify/native-promise-only/
!function(Promise, test){
  isFunction(Promise) && isFunction(Promise.resolve)
  && Promise.resolve(test = new Promise(Function())) == test
  || function(asap, DEF){
    function isThenable(o){
      var then;
      if(isObject(o))then = o.then;
      return isFunction(then) ? then : false;
    }
    function notify(def){
      var chain = def.chain;
      chain.length && asap(function(){
        var msg = def.msg
          , ok  = def.state == 1
          , i   = 0;
        while(chain.length > i)!function(react){
          var cb = ok ? react.ok : react.fail
            , ret, then;
          try {
            if(cb){
              ret = cb === true ? msg : cb(msg);
              if(ret === react.P){
                react.rej(TypeError(PROMISE + '-chain cycle'));
              } else if(then = isThenable(ret)){
                then.call(ret, react.res, react.rej);
              } else react.res(ret);
            } else react.rej(msg);
          } catch(err){
            react.rej(err);
          }
        }(chain[i++]);
        chain.length = 0;
      });
    }
    function resolve(msg){
      var def = this
        , then, wrapper;
      if(def.done)return;
      def.done = true;
      def = def.def || def; // unwrap
      try {
        if(then = isThenable(msg)){
          wrapper = {def: def, done: false}; // wrap
          then.call(msg, ctx(resolve, wrapper, 1), ctx(reject, wrapper, 1));
        } else {
          def.msg = msg;
          def.state = 1;
          notify(def);
        }
      } catch(err){
        reject.call(wrapper || {def: def, done: false}, err); // wrap
      }
    }
    function reject(msg){
      var def = this;
      if(def.done)return;
      def.done = true;
      def = def.def || def; // unwrap
      def.msg = msg;
      def.state = 2;
      notify(def);
    }
    // 25.4.3.1 Promise(executor)
    Promise = function(executor){
      assertFunction(executor);
      assertInstance(this, Promise, PROMISE);
      var def = {chain: [], state: 0, done: false, msg: undefined};
      hidden(this, DEF, def);
      try {
        executor(ctx(resolve, def, 1), ctx(reject, def, 1));
      } catch(err){
        reject.call(def, err);
      }
    }
    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
    hidden(Promise[PROTOTYPE], 'then', function(onFulfilled, onRejected){
      var react = {
        ok:   isFunction(onFulfilled) ? onFulfilled : true,
        fail: isFunction(onRejected)  ? onRejected  : false
      } , P = react.P = new this[CONSTRUCTOR](function(resolve, reject){
        react.res = assertFunction(resolve);
        react.rej = assertFunction(reject);
      }), def = this[DEF];
      def.chain.push(react);
      def.state && notify(def);
      return P;
    });
    // 25.4.5.1 Promise.prototype.catch(onRejected)
    hidden(Promise[PROTOTYPE], 'catch', function(onRejected){
      return this.then(undefined, onRejected);
    });
    // 25.4.4.1 Promise.all(iterable)
    hidden(Promise, 'all', function(iterable){
      var Promise = this
        , values  = [];
      return new Promise(function(resolve, reject){
        forOf(iterable, false, push, values);
        var remaining = values.length
          , results   = Array(remaining);
        if(remaining)forEach.call(values, function(promise, index){
          Promise.resolve(promise).then(function(value){
            results[index] = value;
            --remaining || resolve(results);
          }, reject);
        });
        else resolve(results);
      });
    });
    // 25.4.4.4 Promise.race(iterable)
    hidden(Promise, 'race', function(iterable){
      var Promise = this;
      return new Promise(function(resolve, reject){
        forOf(iterable, false, function(promise){
          Promise.resolve(promise).then(resolve, reject);
        });
      });
    });
    // 25.4.4.5 Promise.reject(r)
    hidden(Promise, 'reject', function(r){
      return new this(function(resolve, reject){
        reject(r);
      });
    });
    // 25.4.4.6 Promise.resolve(x)
    hidden(Promise, 'resolve', function(x){
      return isObject(x) && getPrototypeOf(x) === this[PROTOTYPE]
        ? x : new this(function(resolve, reject){
          resolve(x);
        });
    });
  }(nextTick || setImmediate, symbol('def'));
  setToStringTag(Promise, PROMISE);
  $define(GLOBAL + FORCED * !isNative(Promise), {Promise: Promise});
}(global[PROMISE]);