
__all__ = ["Business"]


def _setState(state, val, default=None):
    try:
        result = state[val]
        if result:
            return result
        else:
            return default
    except:
        return default


class Business:
    """Holds information about a Business or Institution in the network"""
    def __init__(self, props=None, getHook=None):
        self._getHook = getHook

        self.state = {
            "name": [],
            "id": None,
            "projects": {},
            "sources": [],
            "affiliations": {},
            "notes": [],
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
            result.append( (self._getHook(affiliation),
                            affiliations[affiliation]) )

        return result

    def setState(self, state):
        if not state:
            return

        self.state["name"] = _setState(state, "name")
        self.state["id"] = _setState(state, "id")
        self.state["projects"] = _setState(state, "projects", {})
        self.state["affiliations"] = _setState(state, "affiliations", {})
        self.state["sources"] = _setState(state, "sources", [])
        self.state["notes"] = _setState(state, "notes", [])

    def toDry(self):
        return {"value": self.state}

    @staticmethod
    def unDry(value):
        return Business(value)

    @staticmethod
    def load(data):
        return Business(data)
