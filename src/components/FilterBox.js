
import React from 'react';

import {
  Accordion,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel,
} from 'react-accessible-accordion';

import {ResponsiveList, ResponsiveListItem} from './ResponsiveList';
import CheckBox from './CheckBox';
import DefaultButton from './DefaultButton';

import styles from './FilterBox.module.css';

function null_function(args=null){}

function filterList(items, props){
  let social = props.social;

  let emitSelected = props.emitSelected;

  if (!emitSelected){
    emitSelected = null_function;
  }

  let emitToggleFilter = props.emitToggleFilter;

  if (!emitToggleFilter){
    emitToggleFilter = null_function;
  }

  let output = items.values().map((item)=>{
    let is_filtered = social.isFiltered(item);

    return <ResponsiveListItem key={item.getName()}>
              <DefaultButton style={{position:"relative",
                                     maxWidth:"80%"}}
                             onClick={()=>{emitSelected(item);}}>
                {item.getName()}
              </DefaultButton>&nbsp;
              <CheckBox checked={is_filtered}
                        onChange={(event)=>{emitToggleFilter(item);}}/>
           </ResponsiveListItem>;
  });

  return <ResponsiveList>{output}</ResponsiveList>;
}

function FilterBox(props){
  let social = props.social;

  if (!social){
    return <div>No social to display!</div>;
  }

  let filter_text = social.getFilterText();

  if (!filter_text){
    filter_text = "No filters";
  }

  let emitClearFilters = props.emitClearFilters;

  if (!emitClearFilters){
    emitClearFilters = null_function;
  }

  let filter_info = <AccordionItem uuid="filterinfo"
                                className={styles.accordionItem}>
                  <AccordionItemHeading>
                    <AccordionItemButton className={styles.accordionButton}>
                      Current Filter
                    </AccordionItemButton>
                  </AccordionItemHeading>
                  <AccordionItemPanel className={styles.accordionPanel}>
                    <div className={styles.filterContainer}>
                      <div className={styles.filterText}>
                        {filter_text}
                      </div>
                      <div>
                        <DefaultButton onClick={emitClearFilters}>
                          Clear Filters
                        </DefaultButton>
                      </div>
                    </div>
                  </AccordionItemPanel>
                </AccordionItem>;

  let projects = filterList(social.getProjects(false), props);
  let positions = filterList(social.getPositions(false), props);
  let affiliations = filterList(social.getAffiliations(false), props);
  let people = filterList(social.getPeople(false), props);
  let businesses = filterList(social.getBusinesses(false), props);

  return <Accordion allowMultipleExpanded={false}
                    allowZeroExpanded={true}
                    className={styles.accordion}>
          {filter_info}

          <AccordionItem uuid="projects"
                         className={styles.accordionItem}>
            <AccordionItemHeading>
              <AccordionItemButton className={styles.accordionButton}>
                Projects
              </AccordionItemButton>
            </AccordionItemHeading>
            <AccordionItemPanel className={styles.accordionPanel}>
              {projects}
            </AccordionItemPanel>
          </AccordionItem>

          <AccordionItem uuid="people"
                         className={styles.accordionItem}>
            <AccordionItemHeading>
              <AccordionItemButton className={styles.accordionButton}>
                People
              </AccordionItemButton>
            </AccordionItemHeading>
            <AccordionItemPanel className={styles.accordionPanel}>
              {people}
            </AccordionItemPanel>
          </AccordionItem>

          <AccordionItem uuid="businesses"
                         className={styles.accordionItem}>
            <AccordionItemHeading>
              <AccordionItemButton className={styles.accordionButton}>
                Businesses
              </AccordionItemButton>
            </AccordionItemHeading>
            <AccordionItemPanel className={styles.accordionPanel}>
              {businesses}
            </AccordionItemPanel>
          </AccordionItem>

          <AccordionItem uuid="positions"
                         className={styles.accordionItem}>
            <AccordionItemHeading>
              <AccordionItemButton className={styles.accordionButton}>
                Positions
              </AccordionItemButton>
            </AccordionItemHeading>
            <AccordionItemPanel className={styles.accordionPanel}>
              {positions}
            </AccordionItemPanel>
          </AccordionItem>

          <AccordionItem uuid="affiliations"
                         className={styles.accordionItem}>
            <AccordionItemHeading>
              <AccordionItemButton className={styles.accordionButton}>
                Affiliations
              </AccordionItemButton>
            </AccordionItemHeading>
            <AccordionItemPanel className={styles.accordionPanel}>
              {affiliations}
            </AccordionItemPanel>
          </AccordionItem>

        </Accordion>;
}

export default FilterBox;
