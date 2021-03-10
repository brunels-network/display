
__all__ = ["Business"]


def _setState(state, val, default=None):
    try:
        result = state[val]
        if result:
            return result
        else:
            return default
    except KeyError:
        return default


def _mergeProjects(old, new, key):
    old = old[key]
    new = new[key]

    for project, values in new.items():
        if project in old:
            for value in values:
                if value not in old[project]:
                    old[project].append(value)
        else:
            old[project] = values


def _mergeStateItems(old, new, key):
    """ Merge two state items, adds items from new to old state

        Args:
            old (dict): Old object's state
            new (dict): New object's state
            key (str): Key to acccess dictionary values
        Returns:
            None
    """
    for id, data in new[key].items():
        if key not in old:
            old[key] = {}

        old[key][id] = data


class Business:
    """Holds information about a Business or Institution in the network"""

    def __init__(self, props=None, getHook=None):
        self._getHook = getHook

        self.state = {
            "name": None,
            "id": None,
            "projects": {},
            "sources": [],
            "scores": {},
            "positions": {},
            "affiliations": {},
            "highlighted": {},
            "notes": [],
            "weight": {},
            "weight_path": {},
        }

        self.setState(props)

    def __str__(self):
        return f"Business({self.getName()})"

    def getID(self):
        return self.state["id"]

    def getName(self):
        return self.state["name"]

    def getAffiliations(self):
        result = []

        affiliations = self.state["affiliations"]

        for affiliation in affiliations.keys():
            result.append((self._getHook(affiliation), affiliations[affiliation]))

        return result

    def getPositions(self):
        result = {}

        positions = self.state["positions"]

        for project in positions.keys():
            if project not in result:
                result[project] = []

            for position in positions[project]:
                result[project].append(self._getHook(position))

        return result

    def setState(self, state):
        if not state:
            return

        self.state["name"] = _setState(state, "name")
        self.state["id"] = _setState(state, "id")
        self.state["projects"] = _setState(state, "projects", {})
        self.state["affiliations"] = _setState(state, "affiliations", {})
        self.state["scores"] = _setState(state, "scores", {})
        self.state["sources"] = _setState(state, "sources", [])
        self.state["highlighted"] = _setState(state, "highlighted", {})
        self.state["notes"] = _setState(state, "notes", [])
        self.state["weight"] = _setState(state, "weight")
        self.state["weight_path"] = _setState(state, "weight_path", {})
        self.state["positions"] = _setState(state, "positions", {})

        if self.state["name"] == "None" or self.state["name"] is None:
            raise ValueError(f"No name for {self}?")

    def merge(self, other):
        """ Merge two businesses together. This function is used when merging in matching
            people that are involved in another project.

            Args:
                other (Business): Business to merge with this Business object
            Returns:
                Business: New Business object created from combined states
        """
        import copy as _copy

        state = _copy.copy(self.state)

        _mergeProjects(state, other.state, "positions")
        _mergeProjects(state, other.state, "affiliations")
        _mergeProjects(state, other.state, "sources")
        _mergeProjects(state, other.state, "highlighted")

        # for project, dates in other.state["projects"].items():
        #     state["projects"][project] = dates

        # for id, weight in other.state["weight"].items():
        #     state["weight"][id] = weight

        _mergeStateItems(state, other.state, "projects")
        _mergeStateItems(state, other.state, "weight")
        _mergeStateItems(state, other.state, "weight_path")

        # for id, dates in other.state["projects"].items():
        #     state["projects"][id] = dates

        # for id, weight in other.state["weight"].items():
        #     state["weight"][id] = weight

        b = Business()
        b.state = state
        b._getHook = self._getHook

        return b

    def toDry(self):
        return self.state

    @staticmethod
    def unDry(value):
        return Business(value)

    @staticmethod
    def load(data):
        return Business(data)
