
import { BrowserRouter as Router, Link,
         Route, Switch } from 'react-router-dom';
import React, { Suspense, lazy, useState } from 'react';
import ReactDOM from "react-dom";
import { ButtonDropdown, DropdownToggle,
         DropdownMenu, DropdownItem } from 'reactstrap';

import 'bootstrap/dist/css/bootstrap.min.css';

const GraphLoader = [
  lazy(() => import('./version1/GraphLoader')),
  lazy(() => import('./version2/GraphLoader')),
  lazy(() => import('./version3/GraphLoader')),
];

function renderPage(i) {
  const path = "/v" + (i+1);
  return (
    <Route exact path={path} component={GraphLoader[i]}/>
  );
}

function App(props){
  var num_versions = GraphLoader.length;

  var routes = []
  var links = []

  for (var i=0; i<num_versions; ++i)
  {
    const path = "/v" + (i+1);
    links.push(
      <DropdownItem tag={Link} to={path}>Version {i+1}</DropdownItem>
    );
    routes.push(
      <Route exact path={path} component={GraphLoader[i]}/>
    );
  }

  const [dropdownOpen, setOpen] = useState(false);

  const toggle = () => setOpen(!dropdownOpen);

  return (
    <Router>
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <Switch>
          <Route exact path="/" component={GraphLoader[num_versions-1]}/>
          {routes}
        </Switch>
      </Suspense>
      <ButtonDropdown isOpen={dropdownOpen} toggle={toggle}>
        <DropdownToggle caret>
          Choose version...
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem tag={Link} to="/">Latest</DropdownItem>
          {links}
        </DropdownMenu>
      </ButtonDropdown>
      </div>
    </Router>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
