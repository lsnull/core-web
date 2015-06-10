import XDebug from 'debug';
let log = XDebug('RulesEngineNg2.RulesEngineComponent');

import Reflect from 'reflect-metadata';

import {bootstrap, NgFor, NgIf, EventEmitter, Component, View} from 'angular2/angular2';

import {
    FormBuilder,
    Validators,
    formDirectives,
    ControlGroup,
    Control,
    ControlArray
    } from 'angular2/forms';
import {ObservableWrapper} from 'angular2/src/facade/async';

import {Core} from 'src/dc/index.js'
import * as RuleEngine from 'src/rules-engine/RuleEngine.js';


import "bootstrap/css/bootstrap.css!";
import "./styles/rules-engine.css!";
import "./styles/theme-dark.css!";

import rulesEngineTemplate from './rules-engine-ng2.html!text'
import ruleTemplate from './rule.tpl.html!text'
import ruleActionTemplate from './rule-action.tpl.html!text'
import clauseGroupTemplate from './clause-group.tpl.html!text'
import clauseTemplate from './clause.tpl.html!text'

//@Component({
//  selector: 'rule-action',
//  properties: {
//    "rule": "rule",
//    "ruleAction": "rule-action",
//    "index": "index"
//  }
//})
//@View({
//  template: ruleActionTemplate,
//  directives: [formDirectives, NgIf, NgFor],
//  appInjector: [FormBuilder]
//})
//class RuleActionComponent {
//  _ruleAction:any;
//  form:ControlGroup;
//  rule:any;
//  index:number;
//  builder:FormBuilder;
//
//  constructor(b:FormBuilder) {
//    this.builder = b;
//  }
//
//  get ruleAction():any {
//    return this._ruleAction;
//  }
//
//  set ruleAction(ruleAction:any) {
//    var ruleActionControl = this.builder.group({
//      "name": [ruleAction.name, Validators.required]
//    });
//    ruleActionControl.controls.name.valueChanges.toRx().debounce(500).subscribe(
//      (v) => {
//        this._ruleAction = this._ruleAction.clone().withName(v).build()
//        this.saveChanges()
//      })
//    this.form = ruleActionControl
//    this._ruleAction = ruleAction
//  }
//
//  addRuleAction() {
//    //RuleActionActionCreators.addRuleAction(RuleActionBuilder.fromJson({owningRule: this.rule.$key.value}).build(), this.rule)
//  }
//
//  saveChanges() {
//    //RuleActionActionCreators.updateRuleAction(this._ruleAction)
//  }
//
//  onChange(action) {
//  }
//
//  removeRuleAction() {
//    //RuleActionActionCreators.removeRuleAction(this._ruleAction.$key)
//  }
//}
//
//
//@Component({
//  selector: 'clause',
//  properties: {
//    "rule": "rule",
//    "group": "group",
//    "clause": "clause",
//    "index": "index"
//  }
//})
//@View({
//  template: clauseTemplate,
//  directives: [formDirectives, NgIf, NgFor]
//})
//class ClauseComponent {
//  _clause:any;
//  group:any;
//  rule:any;
//  index:number;
//  clauseTypes:Array;
//  comparisons:Array;
//
//  constructor() {
//    //ClauseStore.addChangeListener(this.onChange.bind(this))
//    this.clauseTypes = [{id: 'hello', text: 'foo'}, {id: 'goodbye', text: 'bar'}]
//    this.comparisons = [{id: 'compHello', text: 'cFoo'}, {id: 'compGoodbye', text: 'cBar'}];
//  }
//
//  get clause() {
//    return this._clause;
//  }
//
//  set clause(clause) {
//    this._clause = clause
//  }
//
//  onChange(action) {
//  }
//
//  addClause(rule, group) {
//    //let clause = ClauseBuilder.fromCfg({owningGroup: group.$key}).build()
//    //ClauseActionCreators.addClause(clause, rule.$key)
//  }
//
//  removeClause() {
//    //ClauseActionCreators.removeClause(this._clause)
//  }
//
//  toggleOperator() {
//    //ClauseActionCreators.toggleOperator(this._clause)
//  }
//}
//
//
//@Component({
//  selector: 'clause-group',
//  properties: {
//    "rule": "rule",
//    "group": "group",
//    "index": "index"
//  }
//})
//@View({
//  template: clauseGroupTemplate,
//  directives: [ClauseComponent, formDirectives, NgIf, NgFor]
//})
//class ClauseGroupComponent {
//  _group;
//  rule;
//  index:number;
//  clauses:Array = null;
//  isCollapse: any;
//
//  constructor() {
//    //ClauseStore.addChangeListener(this.onChange.bind(this))
//    this.isCollapse = true;
//  }
//
//  get group() {
//    return this._group;
//  }
//
//  set group(group) {
//    this._group = group
//    var idx = 1
//    // TODO: remove this :)
//    this.clauses = [
//      {
//        $key: 'rule0' + idx + '-group02-clause01',
//        type: 'IsAuthenticated',
//        name: 'User is authenticated',
//        owningGroup: 'rule0' + idx + '-group02',
//        value: true,
//        operator: 'AND'
//      },
//      {
//        $key: 'rule0' + idx + '-group02-clause02',
//        type: 'VisitorLocation',
//        name: 'User is visiting from france',
//        owningGroup: 'rule0' + idx + '-group02',
//        value: 'CA',
//        operator: 'AND'
//      }
//    ]
//    //debugger
//    //this.clauses = ClauseStore.getAll(this._group)
//  }
//
//  onChange(action) {
//    //this.clauses = ClauseStore.getAll(this._group);
//  }
//
//  addGroup(rule:any) {
//    //RuleActionCreators.addGroup(rule.$key, new ClauseGroupBuilder().build())
//  }
//
//  removeGroup() {
//    //RuleActionCreators.removeGroup(this.rule.$key, this._group.$key)
//  }
//
//  toggleOperator(rule, group) {
//    //RuleActionCreators.toggleClauseGroupOperator(this.rule, this._group)
//    //log("Toggle group operator", rule, group)
//  }
//
//  toggleCollapse() {
//    this.isCollapse = !this.isCollapse
//  }
//}


@Component({
  selector: 'rule',
  properties: {
    "rule": "rule",
    "index": "index"
  },
  appInjector: [
    FormBuilder
  ]
})
@View({
  template: ruleTemplate,
  directives: [formDirectives, NgIf, NgFor]
})
class RuleComponent {
  _rule:String;
  form:ControlGroup;
  index:number;
  isCollapse: boolean;

  constructor( public builder:FormBuilder) {
    this._rule = "bad!";
    this.isCollapse = true;
    this.form =  builder.group({
      "name": ["", Validators.required]
    });
    //this.form.controls['name'].valueChanges.toRx().subscribe((v) => log("it changed: ", v))
    ObservableWrapper.subscribe(this.form.controls['name'].valueChanges, (v) => {
      log("wtf?", v)
    });

  }

  get rule():String {
    log('getting rule')
    return this._rule
  }

  set rule(rule:String) {
    log('setting rule')
    this._rule = rule
  }

  addRule() {
    log('ADD RULE')
    RuleEngine.api.ruleRepo.push({
      $key: Core.Key.next(),
      enabled: true,
      groups: [{
        $key: Core.Key.next(),
        enabled:true
      }]
    })
  }

  toggleCollapse() {
    this.isCollapse = !this.isCollapse
  }

  removeRule() {
    //RuleActionCreators.removeRule(this.rule.$key)
  }
}


@Component({
  selector: 'rules-engine',
  appInjector: [FormBuilder]
})
@View({
  template: rulesEngineTemplate,
  directives: [formDirectives, NgIf, NgFor, RuleComponent]
})
class RulesEngine {
  rules:Array;

  constructor() {
    this.rules = ["Bob"]
    log("creating rules engine");
    RuleEngine.store.addChangeListener(this.onChange.bind(this))
    RuleEngine.store.init()
  }

  onChange(event) {
    RuleEngine.store.get().then((rulesAry)=> {
      log("hmmm?", rulesAry)
      this.rules = ["Hello", "World"]
    })
  }


  nameFieldKeyUp(event, rule, foo) {
    log("key typed", arguments);
  }

}

export function main() {
  log("Bootstrapping rules engine")
  return bootstrap(RulesEngine);
}
