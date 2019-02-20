import {observable, action} from 'mobx'

class ISSState {
    @observable passing = false
}

export default  new ISSState();