import Component from '../../lib/Component.js'
import { dispatchAction } from '../../lib/store.js'
import { ShowHide } from '../../lib/Mixins.js'
import { addClass, removeClass, getOffset, getDOMElementIndex } from '../../lib/utils.js'
import { actions, getRiders } from './actions.js'

const DRAG_CLASS = 'ondrag';
const DROP_CLASS = 'dropholder'
export default class Riders extends ShowHide(Component) {

    constructor(className) {
        super(className);

        this.mousePosition = {};

        this.dropHolderItem = null;
        this.listItemOnDrag = null;
        this.betItemOnDrag = null;
        //this.betItemDragHolder = null;

        document.addEventListener('mouseup', this.onMouseUp.bind(this))
        window.addEventListener('resize', this.checkResolution.bind(this))
        this.$clip.addEventListener('mousemove', this.getMousePosition.bind(this))

        getRiders();
    }

    stateToprops(state) {
        return {
            bet: [...state.user.bets[state.season.actEvent]],
            riders: { ...state.riders },
            actEvent: {...state.events[state.season.actEvent]}
        };
    }

    checkResolution(ev) {
        const betDiv = this.$clip.querySelector(`.Play__bet`);
        if((betDiv && this.isMobile()) || (!this.isMobile() && !betDiv)){
            this.forceRender();
        }
    }

    isMobile(){
        return getOffset(this.$clip).width <= 480;
    }

    getMousePosition(e){
        e = e || window.event;

        var pageX = e.pageX;
        var pageY = e.pageY;

        // IE 8
        if (pageX === undefined) {
            pageX = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            pageY = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }

        this.mousePosition = {
            left: pageX,
            top: (pageY - getOffset(this.$clip).top)
        };
    }

    onMouseDownItem(ev){
        if(this.isMobile()){
            this.onMouseDownListItem(ev)
        }
        else {
            this.onMouseDownBetItem(ev);
        }
    }

    onMouseDownListItem(ev) {
        this.listItemOnDrag = ev.target;
        addClass(this.listItemOnDrag, DRAG_CLASS);

        this.setDropHolderItem(this.listItemOnDrag.nextElementSibling)
        this.$clip.appendChild(this.listItemOnDrag);

        this.dragListItem();
    }

    onMouseDownBetItem(ev) {
        this.betItemOnDrag = ev.target;
        //this.betItemDragHolder = ev.target.parentNode;
        addClass(this.betItemOnDrag, DRAG_CLASS);

        this.setDropHolderItem(this.betItemOnDrag.parentNode)
        this.$clip.appendChild(this.betItemOnDrag);

        this.dragBetItem();
    }

    onMouseUp(ev) {
        const dropItem = this.dropHolderItem
        this.setDropHolderItem();

        if(this.listItemOnDrag){
            const newPos = this.isMobile() ? getDOMElementIndex(dropItem) : null
            const riderId = Number(this.listItemOnDrag.getAttribute('riderId'))
            if(!newPos || newPos === this.props.bet.indexOf(riderId)){
                this.forceRender();
            }
            dispatchAction(actions.SET_BET_ITEM, {
                riderId: riderId,
                position: newPos,
                insertRider: this.isMobile()
            })

            this.listItemOnDrag = null;
        }
        if(this.betItemOnDrag){
            const newPos = dropItem ? Number(dropItem.getAttribute('position')) : null
            const riderId = Number(this.betItemOnDrag.getAttribute('riderId'))
            if(!newPos || newPos === this.props.bet.indexOf(riderId)){
                this.forceRender();
            }
            dispatchAction(actions.SET_BET_ITEM, {
                riderId: riderId,
                position: newPos
            })
            this.betItemOnDrag = null;
        }
    }

    setDropHolderItem(item){
        if(this.dropHolderItem){
            removeClass(this.dropHolderItem, DROP_CLASS)
            this.dropHolderItem = null;
        }
        if(item){
            addClass(item, DROP_CLASS);
            this.dropHolderItem = item;
        }
    }

    dragListItem() {
        if(this.listItemOnDrag){
            const listItems = this.$clip.querySelector(`.Play__list`).children;
            const itemToDrop = Array.from(listItems).find((item) => {
                return (
                    item.offsetTop+(parseInt(getComputedStyle(item).height)/2) > this.mousePosition.top
                )
            });
            const holderType = this.setDropHolderItem(itemToDrop);

            this.listItemOnDrag.style.top = this.mousePosition.top + 'px';
            this.listItemOnDrag.style.left = this.mousePosition.left + 'px';

            requestAnimationFrame(this.dragListItem.bind(this))
        }
    }

    dragBetItem() {
        if(this.betItemOnDrag){
            const betItems = this.$clip.querySelector(`.Play__bet`).children;
            const itemToDrop = Array.from(betItems).find((item) => {
                return (
                    item.offsetTop+(parseInt(getComputedStyle(item).height)) > this.mousePosition.top
                    && item.offsetLeft+(parseInt(getComputedStyle(item).width)) > this.mousePosition.left
                )
            });
            const holderType = this.setDropHolderItem(itemToDrop);

            this.betItemOnDrag.style.top = this.mousePosition.top + 'px';
            this.betItemOnDrag.style.left = this.mousePosition.left + 'px';

            requestAnimationFrame(this.dragBetItem.bind(this))
        }
    }

    render() {
        const ridersList = [
            ...this.props.bet.filter(riderId => !!riderId),
            ...Object.keys(this.props.riders).filter(
                riderId => this.props.bet.indexOf(Number(riderId)) === -1
            )
        ]

        return (`
            <div class="Play__list">
                ${ridersList.map(riderId => {
                    if(this.isMobile() || this.props.bet.indexOf(parseInt(riderId)) === -1){
                        return listItemTpl(riderId, this.props.riders[riderId])
                    }
                }).join('')}
            </div>
            ${ !this.isMobile() ? 
                `<div class="Play__bet">
                    ${this.props.bet.map((riderId,position) => {
                        return betItemTpl(position, riderId, this.props.riders[riderId] || {})
                    }).join('')}
                </div>` : ''
            }
        `)
    }
}

const listItemTpl = (riderId, riderData) => (`
    <div class="Play__list-item" riderId="${riderId}"
        onmousedown="onMouseDownItem"
    >
        ${riderData.surname} ${riderData.name}
    </div>
`)

const betItemTpl = (position, riderId, riderData) => (`
    <div class="Play__bet-item" position="${position}">
        ${ riderId ?
            `<div class="bet-item__rider" riderId="${riderId}"
                onmousedown="onMouseDownItem"
            >
                ${riderData.surname} ${riderData.name}
            </div>` : ''
        }
    </div>
`)

