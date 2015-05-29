var Vue = require('../../../../src/vue')
var _ = require('../../../../src/util')
var transition = require('../../../../src/transition')
var Transition = require('../../../../src/transition/transition')

if (_.inBrowser && !_.isIE9) {
  describe('Transition', function () {

    describe('Wrapper methods', function () {
      
      var spy, el, target, parent, vm
      beforeEach(function () {
        el = document.createElement('div')
        target = document.createElement('div')
        parent = document.createElement('div')
        parent.appendChild(target)
        spy = jasmine.createSpy('transition skip')
        vm = new Vue()
        spyOn(transition, 'apply')
      })

      it('append', function () {
        transition.append(el, parent, vm, spy)
        expect(parent.lastChild).toBe(el)
        expect(spy).toHaveBeenCalled()
      })

      it('before', function () {
        transition.before(el, target, vm, spy)
        expect(parent.firstChild).toBe(el)
        expect(el.nextSibling).toBe(target)
        expect(spy).toHaveBeenCalled()
      })

      it('remove', function () {
        transition.remove(target, vm, spy)
        expect(parent.childNodes.length).toBe(0)
        expect(spy).toHaveBeenCalled()
      })

      it('removeThenAppend', function () {
        transition.removeThenAppend(target, el, vm, spy)
        expect(parent.childNodes.length).toBe(0)
        expect(el.firstChild).toBe(target)
        expect(spy).toHaveBeenCalled()
      })

    })

    describe('Skipping', function () {

      var el, vm, op, cb
      beforeEach(function () {
        el = document.createElement('div')
        op = jasmine.createSpy('transition skip op')
        cb = jasmine.createSpy('transition skip cb')
        vm = new Vue()
      })
      
      it('skip el with no transition data', function () {
        transition.apply(el, 1, op, vm, cb)
        expect(op).toHaveBeenCalled()
        expect(cb).toHaveBeenCalled()
      })

      it('skip vm still being compiled', function () {
        el.__v_trans = new Transition(el, 'test', null, vm)
        transition.apply(el, 1, op, vm, cb)
        expect(op).toHaveBeenCalled()
        expect(cb).toHaveBeenCalled()
      })

      it('skip vm with parent still being compiled', function () {
        el.__v_trans = new Transition(el, 'test', null, vm)
        var child = vm.$addChild({
          el: el
        })
        expect(child._isCompiled).toBe(true)
        transition.apply(el, 1, op, child, cb)
        expect(op).toHaveBeenCalled()
        expect(cb).toHaveBeenCalled()
      })

      it('skip when no css transition is available', function () {
        var e = _.transitionEndEvent
        _.transitionEndEvent = null
        el.__v_trans = new Transition(el, 'test', null, vm)
        vm.$mount(el)
        transition.apply(el, 1, op, vm, cb)
        expect(op).toHaveBeenCalled()
        expect(cb).toHaveBeenCalled()
        _.transitionEndEvent = e
      })

    })

    describe('CSS transitions', function () {

      var duration = '50ms'

      // insert a test css
      function insertCSS (text) {
        var cssEl = document.createElement('style')
        cssEl.textContent = text
        document.head.appendChild(cssEl)
      }

      insertCSS(
        '.test {\
          transition: opacity ' + duration + ' ease;\
          -webkit-transition: opacity ' + duration + ' ease;}'
      )
      insertCSS('.test-enter, .test-leave { opacity: 0; }')
      insertCSS(
        '.test-anim-enter {\
          animation: test-enter ' + duration + ';\
          -webkit-animation: test-enter ' + duration + ';}\
        .test-anim-leave {\
          animation: test-leave ' + duration + ';\
          -webkit-animation: test-leave ' + duration + ';}\
        @keyframes test-enter {\
          from { opacity: 0 }\
          to { opacity: 1 }}\
        @-webkit-keyframes test-enter {\
          from { opacity: 0 }\
          to { opacity: 1 }}\
        @keyframes test-leave {\
          from { opacity: 1 }\
          to { opacity: 0 }}\
        @-webkit-keyframes test-leave {\
          from { opacity: 1 }\
          to { opacity: 0 }}'
      )

      var vm, el, op, cb
      beforeEach(function (done) {
        el = document.createElement('div')
        vm = new Vue({ el: el })
        op = jasmine.createSpy('css op')
        cb = jasmine.createSpy('css cb')
        document.body.appendChild(el)
        // !IMPORTANT!
        // this ensures we force a layout for every test.
        _.nextTick(done)
      })

      afterEach(function () {
        document.body.removeChild(el)
      })

      it('skip on 0s duration (execute right at next frame)', function (done) {
        el.__v_trans = new Transition(el, 'test', null, vm)
        el.style.transition =
        el.style.WebkitTransition = 'opacity 0s ease'
        transition.apply(el, 1, op, vm, cb)
        _.nextTick(function () {
          expect(op).toHaveBeenCalled()
          expect(cb).toHaveBeenCalled()
          expect(el.classList.contains('test-enter')).toBe(false)
          transition.apply(el, -1, op, vm, cb)
          _.nextTick(function () {
            expect(op.calls.count()).toBe(2)
            expect(cb.calls.count()).toBe(2)
            expect(el.classList.contains('test-leave')).toBe(false)
            done()
          })
        })
      })

      it('skip when no transition available', function (done) {
        el.__v_trans = new Transition(el, 'test-no-trans', null, vm)
        transition.apply(el, 1, op, vm, cb)
        _.nextTick(function () {
          expect(op).toHaveBeenCalled()
          expect(cb).toHaveBeenCalled()
          expect(el.classList.contains('test-no-trans-enter')).toBe(false)
          transition.apply(el, -1, op, vm, cb)
          _.nextTick(function () {
            expect(op.calls.count()).toBe(2)
            expect(cb.calls.count()).toBe(2)
            expect(el.classList.contains('test-no-trans-leave')).toBe(false)
            done()
          })
        })
      })

      it('transition enter', function (done) {
        document.body.removeChild(el)
        el.__v_trans = new Transition(el, 'test', null, vm)
        // inline style
        el.style.transition =
        el.style.WebkitTransition = 'opacity ' + duration + ' ease'
        transition.apply(el, 1, function () {
          document.body.appendChild(el)
          op()
        }, vm, cb)
        expect(op).toHaveBeenCalled()
        expect(cb).not.toHaveBeenCalled()
        _.nextTick(function () {
          expect(el.classList.contains('test-enter')).toBe(false)
          _.on(el, _.transitionEndEvent, function () {
            expect(cb).toHaveBeenCalled()
            done()
          })
        })
      })

      it('transition leave', function (done) {
        el.__v_trans = new Transition(el, 'test', null, vm)
        // cascaded class style
        el.classList.add('test')
        // force a layout here so the transition can be triggered
        var f = el.offsetHeight
        transition.apply(el, -1, op, vm, cb)
        _.nextTick(function () {
          expect(op).not.toHaveBeenCalled()
          expect(cb).not.toHaveBeenCalled()
          expect(el.classList.contains('test-leave')).toBe(true)
          _.on(el, _.transitionEndEvent, function () {
            expect(op).toHaveBeenCalled()
            expect(cb).toHaveBeenCalled()
            expect(el.classList.contains('test-leave')).toBe(false)
            done()
          })
        })
      })

      it('animation enter', function (done) {
        document.body.removeChild(el)
        el.__v_trans = new Transition(el, 'test-anim', null, vm)
        transition.apply(el, 1, function () {
          document.body.appendChild(el)
          op()
        }, vm, cb)
        _.nextTick(function () {
          expect(op).toHaveBeenCalled()
          expect(cb).not.toHaveBeenCalled()
          expect(el.classList.contains('test-anim-enter')).toBe(true)
          _.on(el, _.animationEndEvent, function () {
            expect(el.classList.contains('test-anim-enter')).toBe(false)
            expect(cb).toHaveBeenCalled()
            done()
          })
        })
      })

      it('animation leave', function (done) {
        el.__v_trans = new Transition(el, 'test-anim', null, vm)
        transition.apply(el, -1, op, vm, cb)
        _.nextTick(function () {
          expect(op).not.toHaveBeenCalled()
          expect(cb).not.toHaveBeenCalled()
          expect(el.classList.contains('test-anim-leave')).toBe(true)
          _.on(el, _.animationEndEvent, function () {
            expect(op).toHaveBeenCalled()
            expect(cb).toHaveBeenCalled()
            expect(el.classList.contains('test-anim-leave')).toBe(false)
            done()
          })
        })
      })

      it('clean up unfinished css callback', function (done) {
        el.__v_trans = new Transition(el, 'test', null, vm)
        el.classList.add('test')
        transition.apply(el, -1, function () {
          document.body.removeChild(el)
        }, vm, cb)
        // cancel early
        _.nextTick(function () {
          expect(el.__v_trans.pendingCssCb).toBeTruthy()
          expect(el.classList.contains('test-leave')).toBe(true)
          transition.apply(el, 1, function () {
            document.body.appendChild(el)
          }, vm)
          expect(cb).not.toHaveBeenCalled()
          expect(el.classList.contains('test-leave')).toBe(false)
          expect(el.__v_trans.pendingCssCb).toBeNull()
          // IMPORTANT
          // Let the queue flush finish before enter the next
          // test. Don't remove the nextTick.
          _.nextTick(done)
        })
      })

      it('cache transition sniff results', function (done) {
        el.__v_trans = new Transition(el, 'test', null, vm)
        el.classList.add('test')
        transition.apply(el, 1, op, vm)
        _.nextTick(function () {
          expect(el.__v_trans.typeCache['test-enter']).not.toBeUndefined()
          done()
        })
      })

    })

    describe('JavaScript transitions', function () {

      var el, vm, op, cb, hooks, emitter
      beforeEach(function () {
        emitter = {}
        hooks = {}
        el = document.createElement('div')
        document.body.appendChild(el)
        op = jasmine.createSpy('js transition op')
        cb = jasmine.createSpy('js transition cb')
        vm = new Vue({ el: el })
      })

      afterEach(function () {
        document.body.removeChild(el)
      })

      it('beforeEnter', function () {
        var spy = jasmine.createSpy('js transition beforeEnter')
        hooks.beforeEnter = function (el) {
          spy(this, el)
        }
        el.__v_trans = new Transition(el, 'test', hooks, vm)
        transition.apply(el, 1, op, vm, cb)
        expect(spy).toHaveBeenCalledWith(vm, el)
      })

      it('enter', function () {
        var spy = jasmine.createSpy('js enter')
        hooks.enter = function (e, done) {
          expect(e).toBe(el)
          expect(op).toHaveBeenCalled()
          done()
          expect(cb).toHaveBeenCalled()
          spy(this)
        }
        el.__v_trans = new Transition(el, 'test', hooks, vm)
        transition.apply(el, 1, op, vm, cb)
        expect(spy).toHaveBeenCalledWith(vm)
      })

      it('leave', function () {
        var spy = jasmine.createSpy('js leave')
        hooks.leave = function (e, done) {
          expect(e).toBe(el)
          done()
          expect(op).toHaveBeenCalled()
          expect(cb).toHaveBeenCalled()
          spy(this)
        }
        el.__v_trans = new Transition(el, 'test', hooks, vm)
        transition.apply(el, -1, op, vm, cb)
        expect(spy).toHaveBeenCalledWith(vm)
      })

      it('no def', function (done) {
        el.__v_trans = new Transition(el, 'test', null, vm)
        transition.apply(el, 1, op, vm, cb)
        _.nextTick(function () {
          expect(op).toHaveBeenCalled()
          expect(cb).toHaveBeenCalled()
          transition.apply(el, -1, op, vm, cb)
          _.nextTick(function () {
            expect(op.calls.count()).toBe(2)
            expect(cb.calls.count()).toBe(2)  
            done()
          })
        })
      })

      it('optional cleanup callback', function (done) {
        var cleanupSpy = jasmine.createSpy('js cleanup')
        var leaveSpy = jasmine.createSpy('js leave')
        hooks.enter = function (el, done) {
          var to = setTimeout(done, 30)
          return function () {
            clearTimeout(to)
            cleanupSpy()
          }
        }
        hooks.leave = function (el, done) {
          expect(cleanupSpy).toHaveBeenCalled()
          leaveSpy()
          done()
        }
        el.__v_trans = new Transition(el, 'test', hooks, vm)
        transition.apply(el, 1, op, vm, cb)
        setTimeout(function () {
          transition.apply(el, -1, op, vm)
          expect(leaveSpy).toHaveBeenCalled()
          setTimeout(function () {
            expect(cb).not.toHaveBeenCalled()
            done()
          }, 30)
        }, 15)
      })

    })

  })
}