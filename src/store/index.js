import { createStore } from 'redux'


const initialState = {
    questions: []
  }

  function reducer (state = initialState, action) {
    console.log(action)
    return state
  }

  const store = createStore(reducer)
  store.dispatch({ type: 'INCREMENT!' })