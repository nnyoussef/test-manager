Feature: Test N01
  Scenario: User Posts Report
    * def group =
      """
      function(list,groupbyKey){
        const group = {}

        for(const item of list){
          const id = item[groupbyKey];
          if(group[id] === undefined){
            group[id] = [];
          }
          group[id].push(item);
        }
        return group;
      }
      """
    Given url 'https://jsonplaceholder.typicode.com/posts/'
    When method get
    Then status 200
    * progressPublisher.accept('Posts Fetched',40)

    * def posts = group(response,'userId')

    Given url 'https://jsonplaceholder.typicode.com/users'
    When method get
    Then status 200
    * def users = group(response,'id')
    * def uiVars = {posts:  '#(posts)', users: '#(users)' , testContext: '#(testContext)' }
    * progressPublisher.accept('Users Fetched',40)

    * progressPublisher.accept('Creating application interface`',95)
    * render.accept('users',uiVars)
