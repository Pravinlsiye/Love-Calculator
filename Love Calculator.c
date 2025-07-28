#include <stdio.h>
#include <stdlib.h>
#include <string.h>
struct node 
{
    int data;
    struct node *next;
    struct node *pre;
};
void print(struct node *p,int b)
{
    int count=0;
    int iter=0;
    while(p->next!=p)
    {
        count=count+1;
        if(count==b)
        {
            iter++;
            count=0;
            p->next->pre=p->pre;
            p->pre->next=p->next;
        }
        p=p->next;
    }
    switch(p->data)
    {
        case 1:
        printf("Friends");
        break;
        case 2:
        printf("Love");
        break;
        case 3:
        printf("Affection");
        break;
        case 4:
        printf("Marriage");
        break;
        case 5:
        printf("Enemy");
        break;
        case 6:
        printf("Sister");
        break;
    }
}
int main()
{
    int a=6;
    struct node *head,*ptr,*previous;
    ptr=(struct node *)malloc(sizeof(struct node));
    if(ptr!=NULL)
    {
        ptr->data=1;
        ptr->next=NULL;
        ptr->pre=NULL;
    }
    head=ptr;
    for(int i=1;i<a;i++)
    {
        previous=(struct node *)malloc(sizeof(struct node));
        if(previous!=NULL){
        previous->data=i+1;
        previous->next=NULL;
        previous->pre=head;
        head->next=previous;
        head=head->next;
        }
    }
    ptr->pre=head;
    head->next=ptr;
    head=ptr;
    int b;
    char firstname[100],second[100];
    printf("Enter first name: ");
    scanf("%s",firstname);
    printf("Enter second name: ");
    scanf("%s",second);
    int len,temp=0,count=0;
    if(strlen(firstname)>=strlen(second))
    {
        temp=1;
    }
    if(temp==1)
    {
       for(int i=0;i<strlen(firstname);i++)
        {
            for(int j=0;j<strlen(second);j++)
            {
               if(firstname[i]==second[j] && firstname[i]!='.' && second[j]!='.')
                {
                     count=count+1;
                    firstname[i]='.';
                    second[j]='.';
                    continue;
                }
            }
        }
    }
    else
    {
        for(int i=0;i<strlen(second);i++)
        {
            for(int j=0;j<strlen(firstname);j++)
            {
                if(firstname[j]==second[i] && firstname[j]!='.' && second[i]!='.')
                {
                    count=count+1;
                    firstname[j]='.';
                    second[i]='.';
                    continue;
                }
            }
        }
    }
    int len1=strlen(firstname)+strlen(second);
    len1=len1-(count*2);
    if(len1!=0)
    {
        print(head,len1);
    }
    else
    {
        printf("Perfect Match!");
    }
    return 0;
}