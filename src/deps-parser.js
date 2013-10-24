var Emitter  = require('./emitter'),
    utils    = require('./utils'),
    observer = new Emitter()

/**
 *  Auto-extract the dependencies of a computed property
 *  by recording the getters triggered when evaluating it.
 */
function catchDeps (binding) {
    utils.log('\n─ ' + binding.key)
    var depsHash = utils.hash()
    observer.on('get', function (dep) {
        if (depsHash[dep.key]) return
        depsHash[dep.key] = 1
        utils.log('  └─ ' + dep.key)
        binding.deps.push(dep)
        dep.subs.push(binding)
    })
    binding.value.get()
    observer.off('get')
}

module.exports = {

    /**
     *  the observer that catches events triggered by getters
     */
    observer: observer,

    /**
     *  parse a list of computed property bindings
     */
    parse: function (bindings) {
        utils.log('\nparsing dependencies...')
        observer.isObserving = true
        bindings.forEach(catchDeps)
        observer.isObserving = false
        utils.log('\ndone.')
    }
    
}